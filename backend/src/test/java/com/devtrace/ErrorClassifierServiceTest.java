package com.devtrace;

import com.devtrace.service.ErrorClassifierService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = WebEnvironment.NONE,
    properties = {"spring.elasticsearch.uris=http://localhost:9200"})
class ErrorClassifierServiceTest {

    @Autowired
    private ErrorClassifierService classifier;

    @ParameterizedTest(name = "classify({0}) = {1}")
    @CsvSource({
        "NullPointerException in UserService,NullPointerException",
        "Unable to acquire JDBC Connection - pool exhausted,DatabaseConnectionException",
        "Read timed out after 5000ms calling payment-gateway,TimeoutException",
        "java.lang.OutOfMemoryError: Java heap space,OutOfMemoryError",
        "HTTP 500 Internal Server Error,HTTP500Error",
        "JWT token validation failed - token expired,AuthenticationException",
        "StackOverflowError: deep recursion detected,StackOverflowError",
        "Some random info message,UnknownError"
    })
    void testClassify(String message, String expectedType) {
        assertEquals(expectedType, classifier.classify(message));
    }

    @Test
    void testRootCauseReturnsNonEmpty() {
        String cause = classifier.getRootCause("NullPointerException");
        assertNotNull(cause);
        assertFalse(cause.isBlank());
    }

    @Test
    void testSeverityForCriticalErrors() {
        assertEquals("CRITICAL", classifier.getSeverity("ERROR", "DatabaseConnectionException"));
        assertEquals("CRITICAL", classifier.getSeverity("ERROR", "OutOfMemoryError"));
    }

    @Test
    void testSeverityForHighErrors() {
        assertEquals("HIGH", classifier.getSeverity("ERROR", "NullPointerException"));
        assertEquals("HIGH", classifier.getSeverity("ERROR", "HTTP500Error"));
    }

    @Test
    void testSeverityForWarn() {
        assertEquals("LOW", classifier.getSeverity("WARN", "TimeoutException"));
    }
}
