package com.example.dentconnect

data class Draft(
    val id: String = "",
    val patientId: String = "",
    val ageGender: String = "",
    val complaint: String = "",
    val timestamp: Long = 0
)
