package com.example.dentconnect

data class NotificationItem(
    val id: String,
    val type: NotificationType,
    val userName: String,
    val message: String,
    val timestamp: String,
    val userImageUrl: String? = null,
    val isFollowing: Boolean = false
)

enum class NotificationType {
    LIKE, COMMENT, FOLLOW
}
