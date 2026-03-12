package com.devtrace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Configuration
public class IndexConfig {

    @Bean("indexNameProvider")
    public IndexNameProvider indexNameProvider() {
        return new IndexNameProvider();
    }

    public static class IndexNameProvider {
        private static final String PREFIX = "devtrace-logs";
        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

        public String currentIndex() {
            return PREFIX + "-" + LocalDate.now().format(FORMATTER);
        }

        public String wildcardIndex() {
            return PREFIX + "-*";
        }
    }
}
