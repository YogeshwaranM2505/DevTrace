package com.devtrace.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.devtrace.model.Alert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final ElasticsearchClient esClient;

    @Value("${devtrace.alerts.threshold-percentage:200}")
    private double thresholdPercentage;

    private static final String ALERT_INDEX = "devtrace-alerts";

    private static final List<String> MONITORED_ERROR_TYPES = List.of(
            "NullPointerException",
            "DatabaseConnectionException",
            "TimeoutException",
            "HTTP500Error",
            "OutOfMemoryError"
    );

    @Scheduled(fixedDelayString = "${devtrace.alerts.check-interval-minutes:60}000")
    public void checkAlerts() {
        log.info("Running alert check...");
        MONITORED_ERROR_TYPES.forEach(errorType -> {
            try {
                checkErrorTypeAlert(errorType);
            } catch (IOException e) {
                log.error("Failed to check alerts for {}: {}", errorType, e.getMessage());
            }
        });
    }

    private void checkErrorTypeAlert(String errorType) throws IOException {
        var now = Instant.now();
        var currentHourStart = now.truncatedTo(ChronoUnit.HOURS);
        var previousHourStart = currentHourStart.minus(1, ChronoUnit.HOURS);

        long currentCount = countErrors(errorType, currentHourStart, now);
        long previousCount = countErrors(errorType, previousHourStart, currentHourStart);

        if (previousCount == 0 && currentCount == 0) return;

        double increase;
        if (previousCount == 0) {
            increase = currentCount > 0 ? 100.0 : 0;
        } else {
            increase = ((double)(currentCount - previousCount) / previousCount) * 100;
        }

        if (increase >= thresholdPercentage) {
            var severity = increase >= 500 ? "CRITICAL" : increase >= 300 ? "HIGH" : "MEDIUM";
            var alert = Alert.builder()
                    .id(UUID.randomUUID().toString())
                    .timestamp(now)
                    .errorType(errorType)
                    .message(String.format("ALERT: %s errors increased by %.0f%% (current: %d, previous: %d)",
                            errorType, increase, currentCount, previousCount))
                    .currentCount(currentCount)
                    .previousCount(previousCount)
                    .percentageIncrease(increase)
                    .severity(severity)
                    .resolved(false)
                    .build();

            saveAlert(alert);
            log.warn("🚨 {}", alert.getMessage());
        }
    }

    private long countErrors(String errorType, Instant from, Instant to) throws IOException {
        return esClient.count(c -> c
                .index("devtrace-logs-*")
                .query(q -> q.bool(b -> b
                        .must(m -> m.term(t -> t.field("errorType").value(errorType)))
                        .must(m -> m.term(t -> t.field("level").value("ERROR")))
                        .must(m -> m.range(r -> r.field("timestamp")
                                .gte(co.elastic.clients.json.JsonData.of(from.toString()))
                                .lt(co.elastic.clients.json.JsonData.of(to.toString()))
                        ))
                ))
        ).count();
    }

    private void saveAlert(Alert alert) throws IOException {
        esClient.index(i -> i
                .index(ALERT_INDEX)
                .id(alert.getId())
                .document(alert)
        );
    }

    public List<Alert> getActiveAlerts() throws IOException {
        try {
            var response = esClient.search(s -> s
                    .index(ALERT_INDEX)
                    .query(q -> q.term(t -> t.field("resolved").value(false)))
                    .sort(so -> so.field(f -> f.field("timestamp")
                            .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)))
                    .size(50),
                    Alert.class
            );

            return response.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Alert index not yet created: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void resolveAlert(String alertId) throws IOException {
        var existing = esClient.get(g -> g.index(ALERT_INDEX).id(alertId), Alert.class);
        if (existing.found() && existing.source() != null) {
            var alert = existing.source();
            alert.setResolved(true);
            esClient.index(i -> i.index(ALERT_INDEX).id(alertId).document(alert));
        }
    }
}
