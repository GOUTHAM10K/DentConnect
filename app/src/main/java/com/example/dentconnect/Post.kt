package com.example.dentconnect

data class Post(
    val postId: String = "",
    val userId: String = "",
    val userName: String = "",
    val userRole: String = "",
    val userPhoto: String = "",
    val caption: String = "",
    val caseTitle: String = "",
    val diagnosis: String = "",
    val imageUrls: List<String> = listOf(),
    val timestamp: Long = 0,
    var likesCount: Int = 0,
    var commentsCount: Int = 0,
    val visibility: String = "public"
)
