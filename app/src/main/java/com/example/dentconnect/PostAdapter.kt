package com.example.dentconnect

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

class PostAdapter(private val posts: List<Post>) : RecyclerView.Adapter<PostAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivUserThumb: ImageView = view.findViewById(R.id.ivUserThumb)
        val tvUserName: TextView = view.findViewById(R.id.tvUserName)
        val tvUserRole: TextView = view.findViewById(R.id.tvUserRole)
        val tvPostContent: TextView = view.findViewById(R.id.tvPostContent)
        val tvLikes: TextView = view.findViewById(R.id.tvLikes)
        val tvCommentCount: TextView = view.findViewById(R.id.tvCommentCount)
        val ivPostImage1: ImageView = view.findViewById(R.id.ivPostImage1)
        val ivPostImage2: ImageView = view.findViewById(R.id.ivPostImage2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_network_post, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val post = posts[position]
        holder.tvUserName.text = post.userName
        holder.tvUserRole.text = post.userRole
        holder.tvPostContent.text = post.caption
        holder.tvLikes.text = post.likesCount.toString()
        holder.tvCommentCount.text = post.commentsCount.toString()

        // Load User Thumbnail
        if (post.userPhoto.isNotEmpty()) {
            Glide.with(holder.itemView.context)
                .load(post.userPhoto)
                .placeholder(R.drawable.ic_profile)
                .circleCrop()
                .into(holder.ivUserThumb)
        } else {
            Glide.with(holder.itemView.context)
                .load(R.drawable.ic_profile)
                .circleCrop()
                .into(holder.ivUserThumb)
        }

        // Load Post Images
        if (post.imageUrls.isNotEmpty()) {
            Glide.with(holder.itemView.context)
                .load(post.imageUrls[0])
                .placeholder(R.drawable.teeth_placeholder)
                .centerCrop()
                .into(holder.ivPostImage1)
                
            if (post.imageUrls.size > 1) {
                holder.ivPostImage2.visibility = View.VISIBLE
                Glide.with(holder.itemView.context)
                    .load(post.imageUrls[1])
                    .placeholder(R.drawable.teeth_placeholder)
                    .centerCrop()
                    .into(holder.ivPostImage2)
            } else {
                holder.ivPostImage2.visibility = View.GONE
            }
        } else {
            holder.ivPostImage1.setImageResource(R.drawable.teeth_placeholder)
            holder.ivPostImage2.visibility = View.GONE
        }
    }

    override fun getItemCount() = posts.size
}
