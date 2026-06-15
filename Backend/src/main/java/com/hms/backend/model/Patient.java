package com.hms.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Document(collection = "patients")
public class Patient {
    @Id
    private String id;

    @Indexed(unique = true)
    private String patientId;

    private PersonalInfo personalInfo;
    private ContactInfo contactInfo;
    private List<EmergencyContact> emergencyContacts;
    private InsuranceDetails insuranceDetails;
    private String primaryDoctorId;
    private AiHealthProfile aiHealthProfile;

    private boolean active = true; // Soft delete flag

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Patient() {}

    public Patient(String id, String patientId, PersonalInfo personalInfo, ContactInfo contactInfo, 
                   List<EmergencyContact> emergencyContacts, InsuranceDetails insuranceDetails, 
                   String primaryDoctorId, AiHealthProfile aiHealthProfile, boolean active) {
        this.id = id;
        this.patientId = patientId;
        this.personalInfo = personalInfo;
        this.contactInfo = contactInfo;
        this.emergencyContacts = emergencyContacts;
        this.insuranceDetails = insuranceDetails;
        this.primaryDoctorId = primaryDoctorId;
        this.aiHealthProfile = aiHealthProfile;
        this.active = active;
    }

    // Main Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public PersonalInfo getPersonalInfo() { return personalInfo; }
    public void setPersonalInfo(PersonalInfo personalInfo) { this.personalInfo = personalInfo; }

    public ContactInfo getContactInfo() { return contactInfo; }
    public void setContactInfo(ContactInfo contactInfo) { this.contactInfo = contactInfo; }

    public List<EmergencyContact> getEmergencyContacts() { return emergencyContacts; }
    public void setEmergencyContacts(List<EmergencyContact> emergencyContacts) { this.emergencyContacts = emergencyContacts; }

    public InsuranceDetails getInsuranceDetails() { return insuranceDetails; }
    public void setInsuranceDetails(InsuranceDetails insuranceDetails) { this.insuranceDetails = insuranceDetails; }

    public String getPrimaryDoctorId() { return primaryDoctorId; }
    public void setPrimaryDoctorId(String primaryDoctorId) { this.primaryDoctorId = primaryDoctorId; }

    public AiHealthProfile getAiHealthProfile() { return aiHealthProfile; }
    public void setAiHealthProfile(AiHealthProfile aiHealthProfile) { this.aiHealthProfile = aiHealthProfile; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    // Static nested classes
    public static class PersonalInfo {
        private String firstName;
        private String lastName;
        private LocalDate dateOfBirth;
        private String gender;
        private String bloodGroup;

        public PersonalInfo() {}
        public PersonalInfo(String firstName, String lastName, LocalDate dateOfBirth, String gender, String bloodGroup) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.dateOfBirth = dateOfBirth;
            this.gender = gender;
            this.bloodGroup = bloodGroup;
        }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    }

    public static class ContactInfo {
        private String email;
        private String phone;
        private String address;

        public ContactInfo() {}
        public ContactInfo(String email, String phone, String address) {
            this.email = email;
            this.phone = phone;
            this.address = address;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }

    public static class EmergencyContact {
        private String name;
        private String relationship;
        private String phone;

        public EmergencyContact() {}
        public EmergencyContact(String name, String relationship, String phone) {
            this.name = name;
            this.relationship = relationship;
            this.phone = phone;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRelationship() { return relationship; }
        public void setRelationship(String relationship) { this.relationship = relationship; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class InsuranceDetails {
        private String provider;
        private String policyNumber;
        private LocalDate expiryDate;

        public InsuranceDetails() {}
        public InsuranceDetails(String provider, String policyNumber, LocalDate expiryDate) {
            this.provider = provider;
            this.policyNumber = policyNumber;
            this.expiryDate = expiryDate;
        }

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getPolicyNumber() { return policyNumber; }
        public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    }

    public static class AiHealthProfile {
        private Integer riskScore;
        private String riskCategory;

        public AiHealthProfile() {}
        public AiHealthProfile(Integer riskScore, String riskCategory) {
            this.riskScore = riskScore;
            this.riskCategory = riskCategory;
        }

        public Integer getRiskScore() { return riskScore; }
        public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
        public String getRiskCategory() { return riskCategory; }
        public void setRiskCategory(String riskCategory) { this.riskCategory = riskCategory; }
    }
}
