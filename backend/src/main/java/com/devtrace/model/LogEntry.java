package com.devtrace.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "#{@indexNameProvider.currentIndex()}")
public class LogEntry {

    @Id
    private String id;

    @NotNull
    @Field(type = FieldType.Date)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant timestamp;

    @NotBlank
    @Field(type = FieldType.Keyword)
    private String level; // ERROR, WARN, INFO, DEBUG

    @NotBlank
    @Field(type = FieldType.Text, analyzer = "standard")
    private String message;

    @Field(type = FieldType.Keyword)
    private String service;

    @Field(type = FieldType.Keyword)
    private String errorType; // NullPointerException, DatabaseConnectionException, etc.

    @Field(type = FieldType.Text)
    private String rootCause;

    @Field(type = FieldType.Keyword)
    private String host;

    @Field(type = FieldType.Keyword)
    private String environment; // production, staging, dev

    @Field(type = FieldType.Keyword)
    private String traceId;

    @Field(type = FieldType.Integer)
    private Integer statusCode; // HTTP status code if applicable

    @Field(type = FieldType.Text)
    private String stackTrace;
}
