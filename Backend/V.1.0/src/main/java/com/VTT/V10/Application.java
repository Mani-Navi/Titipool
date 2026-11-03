package com.VTT.V10;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application bootstrap for Persian VTT Platform.
 */
@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
@EnableScheduling
@EnableAsync
@EnableCaching
public class Application {

	public static void main(String[] args) {
		// Force IPv4 stack in Docker/Linux to prevent 20-second IPv6 DNS/socket timeouts on outbound Google OAuth calls
		System.setProperty("java.net.preferIPv4Stack", "true");
		SpringApplication.run(Application.class, args);
	}
}