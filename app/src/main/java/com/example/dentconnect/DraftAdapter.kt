package com.example.dentconnect

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.text.SimpleDateFormat
import java.util.*

class DraftAdapter(private val drafts: List<Draft>) :
    RecyclerView.Adapter<DraftAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvDraftTitle: TextView = view.findViewById(R.id.tvDraftTitle)
        val tvDraftSubtitle: TextView = view.findViewById(R.id.tvDraftSubtitle)
        val tvDraftDate: TextView = view.findViewById(R.id.tvDraftDate)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_draft, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val draft = drafts[position]
        
        holder.tvDraftTitle.text = "Patient ID: ${draft.patientId}"
        holder.tvDraftSubtitle.text = draft.ageGender
        
        val sdf = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())
        val dateStr = sdf.format(Date(draft.timestamp))
        holder.tvDraftDate.text = "Last updated: $dateStr"
    }

    override fun getItemCount() = drafts.size
}
