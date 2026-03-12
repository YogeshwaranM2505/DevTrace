package com.devtrace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DevTraceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DevTraceApplication.class, args);
    }
}
