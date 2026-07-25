package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import android.widget.ImageView
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class ShareCaseActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var userName: String = "Dr. User"
    private var userRole: String = "Dentist"
    private var userPhoto: String = ""
    private var caseId: String? = null
    
    private var patientId: String = ""
    private var diagnosis: String = ""
    private var imageUrls: List<String> = listOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_share_case)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        caseId = intent.getStringExtra("caseId")

        fetchUserProfile()
        fetchCaseDetails()

        findViewById<ImageView>(R.id.ivBack).setOnClickListener { finish() }

        val etCaption = findViewById<EditText>(R.id.etCaption)
        val rgVisibility = findViewById<RadioGroup>(R.id.rgVisibility)

        findViewById<TextView>(R.id.tvPost).setOnClickListener {
            val caption = etCaption.text.toString().trim()
            val visibility = when (rgVisibility.checkedRadioButtonId) {
                R.id.rbPublic -> "public"
                R.id.rbConnections -> "connections"
                else -> "private"
            }

            shareToNetwork(caption, visibility)
        }
    }

    private fun fetchUserProfile() {
        val user = auth.currentUser ?: return
        db.collection("users").document(user.uid).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    userName = doc.getString("name") ?: "Dr. User"
                    userRole = doc.getString("specialization") ?: "Dentist"
                    userPhoto = doc.getString("photoUrl") ?: ""
                }
            }
    }

    private fun fetchCaseDetails() {
        val user = auth.currentUser ?: return
        if (caseId == null) return

        db.collection("users").document(user.uid)
            .collection("cases").document(caseId!!).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    patientId = doc.getString("patientId") ?: ""
                    diagnosis = doc.getString("diagnosis") ?: ""
                    imageUrls = doc.get("imageUrls") as? List<String> ?: listOf()

                    findViewById<TextView>(R.id.tvCaseTitle).text = if (patientId.isNotEmpty()) "Patient Ref: $patientId" else "Clinical Case"
                    findViewById<TextView>(R.id.tvCaseDiagnosis).text = if (diagnosis.isNotEmpty()) diagnosis else "No diagnosis specified"

                    if (imageUrls.isNotEmpty()) {
                        val ivCaseThumb = findViewById<ImageView>(R.id.ivCaseThumb)
                        Glide.with(this)
                            .load(imageUrls[0])
                            .placeholder(R.drawable.teeth_placeholder)
                            .centerCrop()
                            .into(ivCaseThumb)
                    }
                } else {
                    // Fallback: check posts document
                    db.collection("posts").document(caseId!!).get()
                        .addOnSuccessListener { postDoc ->
                            if (postDoc.exists()) {
                                diagnosis = postDoc.getString("diagnosis") ?: ""
                                imageUrls = postDoc.get("imageUrls") as? List<String> ?: listOf()
                                findViewById<TextView>(R.id.tvCaseDiagnosis).text = if (diagnosis.isNotEmpty()) diagnosis else "Clinical Case"
                                if (imageUrls.isNotEmpty()) {
                                    val ivCaseThumb = findViewById<ImageView>(R.id.ivCaseThumb)
                                    Glide.with(this)
                                        .load(imageUrls[0])
                                        .placeholder(R.drawable.teeth_placeholder)
                                        .centerCrop()
                                        .into(ivCaseThumb)
                                }
                            }
                        }
                }
            }
    }

    private fun shareToNetwork(caption: String, visibility: String) {
        val user = auth.currentUser ?: return
        
        val newPostRef = if (caseId != null) db.collection("posts").document(caseId!!) else db.collection("posts").document()
        val post = Post(
            postId = newPostRef.id,
            userId = user.uid,
            userName = userName,
            userRole = userRole,
            userPhoto = userPhoto,
            caption = if (caption.isNotEmpty()) caption else "Clinical Case Overview",
            caseTitle = if (patientId.isNotEmpty()) "Patient Ref: $patientId" else "Clinical Case",
            diagnosis = diagnosis,
            imageUrls = imageUrls,
            timestamp = System.currentTimeMillis(),
            visibility = visibility
        )

        newPostRef.set(post)
            .addOnSuccessListener {
                Toast.makeText(this, "Successfully shared to network!", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, NetworkActivity::class.java))
                finishAffinity()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Failed to post: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}

