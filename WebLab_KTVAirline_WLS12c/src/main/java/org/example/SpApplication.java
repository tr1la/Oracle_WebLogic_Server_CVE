package org.example;

import lombok.Generated;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


@EnableJpaRepositories(basePackages = "org.example.*")
@ComponentScan(basePackages = { "org.example.*" })
@EntityScan("org.example.entity")
@EnableScheduling
@SpringBootApplication(exclude = SecurityAutoConfiguration.class)
public class SpApplication extends SpringBootServletInitializer {
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(SpApplication.class);
    }

    @Generated
    public static void main(String[] args) {
        SpringApplication.run(SpApplication.class, args);
    }
}
