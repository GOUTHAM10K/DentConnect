package com.example.dentconnect

import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView

class CaseImageAdapter(
    private val images: List<Uri>,
    private val onImageClick: (Int) -> Unit
) : RecyclerView.Adapter<CaseImageAdapter.ViewHolder>() {

    private var selectedIndex = -1

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivPhoto: ImageView = view.findViewById(R.id.ivPhoto)
        val ivSelected: ImageView = view.findViewById(R.id.ivSelected)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_case_image, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.ivPhoto.setImageURI(images[position])
        
        if (position == selectedIndex) {
            holder.ivSelected.visibility = View.VISIBLE
        } else {
            holder.ivSelected.visibility = View.GONE
        }

        holder.itemView.setOnClickListener {
            val prev = selectedIndex
            selectedIndex = position
            notifyItemChanged(prev)
            notifyItemChanged(selectedIndex)
            onImageClick(position)
        }
    }

    fun getSelectedImageUri(): Uri? {
        return if (selectedIndex != -1 && selectedIndex < images.size) images[selectedIndex] else null
    }

    override fun getItemCount() = images.size
}
