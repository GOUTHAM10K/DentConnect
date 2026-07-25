package com.example.dentconnect

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class NotificationAdapter(private val notifications: List<NotificationItem>) :
    RecyclerView.Adapter<NotificationAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivUserImage: ImageView = view.findViewById(R.id.ivUserImage)
        val tvNotificationText: TextView = view.findViewById(R.id.tvNotificationText)
        val tvTime: TextView = view.findViewById(R.id.tvTime)
        val btnFollow: Button = view.findViewById(R.id.btnFollow)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_notification, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val notification = notifications[position]
        
        holder.tvNotificationText.text = "${notification.userName} ${notification.message}"
        holder.tvTime.text = notification.timestamp
        
        if (notification.type == NotificationType.FOLLOW) {
            holder.btnFollow.visibility = View.VISIBLE
            holder.btnFollow.text = if (notification.isFollowing) "Following" else "Follow"
        } else {
            holder.btnFollow.visibility = View.GONE
        }
    }

    override fun getItemCount() = notifications.size
}
