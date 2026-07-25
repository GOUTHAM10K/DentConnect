package com.example.dentconnect

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class DraftsActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_drafts)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        findViewById<ImageView>(R.id.ivBack).setOnClickListener {
            finish()
        }

        val rvDrafts = findViewById<RecyclerView>(R.id.rvDrafts)
        val tvEmpty = findViewById<TextView>(R.id.tvEmpty)

        rvDrafts.layoutManager = LinearLayoutManager(this)

        fetchDrafts(rvDrafts, tvEmpty)
    }

    private fun fetchDrafts(rvDrafts: RecyclerView, tvEmpty: TextView) {
        val userId = auth.currentUser?.uid ?: return

        db.collection("users").document(userId)
            .collection("drafts")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { value, error ->
                if (error != null) {
                    return@addSnapshotListener
                }

                val draftsList = mutableListOf<Draft>()
                if (value != null) {
                    for (doc in value.documents) {
                        val draft = doc.toObject(Draft::class.java)
                        if (draft != null) {
                            draftsList.add(draft.copy(id = doc.id))
                        }
                    }
                }

                if (draftsList.isEmpty()) {
                    tvEmpty.visibility = View.VISIBLE
                    rvDrafts.visibility = View.GONE
                } else {
                    tvEmpty.visibility = View.GONE
                    rvDrafts.visibility = View.VISIBLE
                    rvDrafts.adapter = DraftAdapter(draftsList)
                }
            }
    }
}
