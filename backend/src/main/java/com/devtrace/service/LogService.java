package com.devtrace.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.devtrace.config.IndexConfig;
import com.devtrace.model.Dto;
import com.devtrace.model.LogEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogService {

    private final ElasticsearchClient esClient;
    private final ErrorClassifierService classifier;
    private final IndexConfig.IndexNameProvider indexNameProvider;

    public LogEntry ingestLog(Dto.LogIngestRequest request) throws IOException {
        var errorType = classifier.classify(request.getMessage());
        var entry = LogEntry.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : Instant.now())
                .level(request.getLevel() != null ? request.getLevel().toUpperCase() : "INFO")
                .message(request.getMessage())
                .service(request.getService())
                .host(request.getHost())
                .environment(request.getEnvironment() != null ? request.getEnvironment() : "production")
                .traceId(request.getTraceId() != null ? request.getTraceId() : UUID.randomUUID().toString())
                .statusCode(request.getStatusCode())
                .stackTrace(request.getStackTrace())
                .errorType(errorType)
                .rootCause(classifier.getRootCause(errorType))
                .build();

        IndexResponse response = esClient.index(i -> i
                .index(indexNameProvider.currentIndex())
                .id(entry.getId())
                .document(entry)
        );

        log.debug("Indexed log entry: {} → {}", entry.getId(), response.result());
        return entry;
    }

    public List<LogEntry> getErrors(int page, int size) throws IOException {
        SearchResponse<LogEntry> response = esClient.search(s -> s
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.term(t -> t.field("level").value("ERROR")))
                .sort(so -> so.field(f -> f.field("timestamp").order(SortOrder.Desc)))
                .from(page * size)
                .size(size),
                LogEntry.class
        );

        return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<Dto.ErrorSummary> getTopErrors(int limit) throws IOException {
        var now = Instant.now();
        var dayStart = now.truncatedTo(ChronoUnit.DAYS);

        SearchResponse<LogEntry> response = esClient.search(s -> s
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.bool(b -> b
                        .must(m -> m.term(t -> t.field("level").value("ERROR")))
                        .must(m -> m.range(r -> r.field("timestamp").gte(co.elastic.clients.json.JsonData.of(dayStart.toString()))))
                ))
                .size(0)
                .aggregations("by_error_type", a -> a
                        .terms(t -> t.field("errorType").size(limit))
                        .aggregations("top_service", sa -> sa
                                .terms(st -> st.field("service").size(1))
                        )
                        .aggregations("last_seen", la -> la
                                .max(m -> m.field("timestamp"))
                        )
                ),
                LogEntry.class
        );

        var buckets = response.aggregations()
                .get("by_error_type")
                .sterms()
                .buckets()
                .array();

        return buckets.stream().map(bucket -> {
            String errorType = bucket.key().stringValue();
            String service = "unknown";
            try {
                var svcBuckets = bucket.aggregations().get("top_service").sterms().buckets().array();
                if (!svcBuckets.isEmpty()) {
                    service = svcBuckets.get(0).key().stringValue();
                }
            } catch (Exception ignored) {}

            Instant lastSeen = null;
            try {
                Double maxVal = bucket.aggregations().get("last_seen").max().value();
                if (maxVal != null && !Double.isNaN(maxVal)) {
                    lastSeen = Instant.ofEpochMilli(maxVal.longValue());
                }
            } catch (Exception ignored) {}

            return Dto.ErrorSummary.builder()
                    .errorType(errorType)
                    .count(bucket.docCount())
                    .possibleCause(classifier.getRootCause(errorType))
                    .mostAffectedService(service)
                    .lastSeen(lastSeen)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<Dto.TimelinePoint> getTimeline(int hours) throws IOException {
        var now = Instant.now();
        var from = now.minus(hours, ChronoUnit.HOURS);

        SearchResponse<LogEntry> response = esClient.search(s -> s
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.range(r -> r.field("timestamp")
                        .gte(co.elastic.clients.json.JsonData.of(from.toString()))
                ))
                .size(0)
                .aggregations("timeline", a -> a
                        .dateHistogram(dh -> dh
                                .field("timestamp")
                                .calendarInterval(co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Hour)
                        )
                        .aggregations("by_level", la -> la
                                .terms(t -> t.field("level").size(5))
                        )
                ),
                LogEntry.class
        );

        return response.aggregations()
                .get("timeline")
                .dateHistogram()
                .buckets()
                .array()
                .stream()
                .map(bucket -> {
                    var levelCounts = new HashMap<String, Long>();
                    try {
                        bucket.aggregations().get("by_level").sterms().buckets().array()
                                .forEach(lb -> levelCounts.put(lb.key().stringValue(), lb.docCount()));
                    } catch (Exception ignored) {}

                    return Dto.TimelinePoint.builder()
                            .time(bucket.keyAsString())
                            .errorCount(levelCounts.getOrDefault("ERROR", 0L))
                            .warnCount(levelCounts.getOrDefault("WARN", 0L))
                            .infoCount(levelCounts.getOrDefault("INFO", 0L))
                            .build();
                })
                .collect(Collectors.toList());
    }

    public Dto.SearchResult searchLogs(Dto.SearchRequest request) throws IOException {
        var query = esClient.search(s -> {
            s.index(indexNameProvider.wildcardIndex())
             .from(request.getPage() * request.getSize())
             .size(request.getSize())
             .sort(so -> so.field(f -> f.field("timestamp").order(SortOrder.Desc)));

            s.query(q -> q.bool(b -> {
                if (request.getQuery() != null && !request.getQuery().isBlank()) {
                    b.must(m -> m.multiMatch(mm -> mm
                            .query(request.getQuery())
                            .fields(List.of("message", "errorType", "service", "rootCause"))
                            .fuzziness("AUTO")
                    ));
                }
                if (request.getLevel() != null && !request.getLevel().isBlank()) {
                    b.filter(f -> f.term(t -> t.field("level").value(request.getLevel())));
                }
                if (request.getService() != null && !request.getService().isBlank()) {
                    b.filter(f -> f.term(t -> t.field("service").value(request.getService())));
                }
                if (request.getFrom() != null) {
                    b.filter(f -> f.range(r -> r.field("timestamp")
                            .gte(co.elastic.clients.json.JsonData.of(request.getFrom().toString()))));
                }
                if (request.getTo() != null) {
                    b.filter(f -> f.range(r -> r.field("timestamp")
                            .lte(co.elastic.clients.json.JsonData.of(request.getTo().toString()))));
                }
                return b;
            }));

            return s;
        }, LogEntry.class);

        var logs = query.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return Dto.SearchResult.builder()
                .logs(logs)
                .totalHits(query.hits().total() != null ? query.hits().total().value() : 0)
                .page(request.getPage())
                .size(request.getSize())
                .build();
    }

    public Dto.DashboardStats getDashboardStats() throws IOException {
        var now = Instant.now();
        var dayStart = now.truncatedTo(ChronoUnit.DAYS);

        var totalResponse = esClient.count(c -> c
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.range(r -> r.field("timestamp")
                        .gte(co.elastic.clients.json.JsonData.of(dayStart.toString()))
                ))
        );

               var errorResponse = esClient.count(c -> c
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.bool(b -> b
                        .must(m -> m.term(t -> t.field("level").value("ERROR")))
                        .must(m -> m.range(r -> r.field("timestamp")
                                .gte(co.elastic.clients.json.JsonData.of(dayStart.toString()))))
                ))
        );

        var topErrors = getTopErrors(5);
        var timeline = getTimeline(24);

        // Errors by service
        var serviceAgg = esClient.search(s -> s
                .index(indexNameProvider.wildcardIndex())
                .query(q -> q.bool(b -> b
                        .must(m -> m.term(t -> t.field("level").value("ERROR")))
                        .must(m -> m.range(r -> r.field("timestamp")
                                .gte(co.elastic.clients.json.JsonData.of(dayStart.toString()))))
                ))
                .size(0)
                .aggregations("by_service", a -> a.terms(t -> t.field("service").size(10))),
                LogEntry.class
        );

        Map<String, Long> errorsByService = new LinkedHashMap<>();
        serviceAgg.aggregations().get("by_service").sterms().buckets().array()
                .forEach(b -> errorsByService.put(b.key().stringValue(), b.docCount()));

        long totalToday = totalResponse.count();
        long errorsToday = errorResponse.count();
        double errorRate = totalToday > 0 ? (errorsToday * 100.0 / totalToday) : 0;

        return Dto.DashboardStats.builder()
                .totalLogsToday(totalToday)
                .totalErrorsToday(errorsToday)
                .activeAlerts(0L) // populated by AlertService
                .uniqueServicesAffected((long) errorsByService.size())
                .mostFrequentError(topErrors.isEmpty() ? "None" : topErrors.get(0).getErrorType())
                .errorRate(Math.round(errorRate * 100.0) / 100.0)
                .topErrors(topErrors)
                .timeline(timeline)
                .errorsByService(errorsByService)
                .build();
    } // <-- closes getDashboardStats()

} // <-- closes LogService class
