package com.hms.backend.features.reports.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "daily_analytics_snapshots")
public class DailyAnalyticsSnapshot {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private LocalDate date;

    @Field("active_admissions")
    private int activeAdmissions;

    @Field("bed_occupancy_rates")
    private Map<String, Double> bedOccupancyRates;

    @Field("total_revenue")
    private double totalRevenue;

    @Field("revenue_by_department")
    private Map<String, Double> revenueByDepartment;

    @Field("er_cases_count")
    private int erCasesCount;

    @Field("er_average_wait_time_minutes")
    private double erAverageWaitTimeMinutes;
}
