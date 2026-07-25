package com.example.dentconnect

import android.os.Bundle
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class NotificationsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)

        findViewById<ImageView>(R.id.ivBack).setOnClickListener {
            finish()
        }

        val rvNotifications = findViewById<RecyclerView>(R.id.rvNotifications)
        rvNotifications.layoutManager = LinearLayoutManager(this)
        
        // Dummy Data
        val dummyNotifications = listOf(
            NotificationItem("1", NotificationType.LIKE, "Dr. Sarah", "liked your RCT case", "2h ago"),
            NotificationItem("2", NotificationType.COMMENT, "Dr. John", "commented: Great work!", "5h ago"),
            NotificationItem("3", NotificationType.FOLLOW, "Dr. Emily", "started following you", "1d ago", isFollowing = false),
            NotificationItem("4", NotificationType.LIKE, "Dr. Mike", "liked your profile photo", "1d ago"),
            NotificationItem("5", NotificationType.FOLLOW, "Dr. Alex", "started following you", "2d ago", isFollowing = true)
        )

        val adapter = NotificationAdapter(dummyNotifications)
        rvNotifications.adapter = adapter
    }
}
