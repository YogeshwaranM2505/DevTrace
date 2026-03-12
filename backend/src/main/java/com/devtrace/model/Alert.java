package com.devtrace.model;

import com.fasterxml.jackson.annotation.JsonFormat;
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
@Document(indexName = "devtrace-alerts")
public class Alert {

    @Id
    private String id;

    @Field(type = FieldType.Date)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String errorType;

    @Field(type = FieldType.Text)
    private String message;

    @Field(type = FieldType.Long)
    private Long currentCount;

    @Field(type = FieldType.Long)
    private Long previousCount;

    @Field(type = FieldType.Double)
    private Double percentageIncrease;

    @Field(type = FieldType.Keyword)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Field(type = FieldType.Boolean)
    private Boolean resolved;

    @Field(type = FieldType.Keyword)
    private String service;
}
