package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class CaseSheetActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var caseId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_case_sheet)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        caseId = intent.getStringExtra("caseId")

        findViewById<ImageView>(R.id.ivBack).setOnClickListener { finish() }

        findViewById<Button>(R.id.btnExport).setOnClickListener {
            val intent = Intent(this, ShareCaseActivity::class.java)
            intent.putExtra("caseId", caseId)
            startActivity(intent)
        }

        findViewById<Button>(R.id.btnEdit).setOnClickListener {
            onBackPressed()
        }

        loadCaseDetails()
    }

    private fun loadCaseDetails() {
        val user = auth.currentUser ?: return
        if (caseId == null) {
            Toast.makeText(this, "Error: Case ID is missing", Toast.LENGTH_SHORT).show()
            return
        }

        db.collection("users").document(user.uid)
            .collection("cases").document(caseId!!).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    findViewById<TextView>(R.id.tvPatientId).text = doc.getString("patientId") ?: "N/A"
                    
                    val timestamp = doc.getLong("timestamp")
                    if (timestamp != null) {
                        val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
                        findViewById<TextView>(R.id.tvDate).text = sdf.format(Date(timestamp))
                    }

                    findViewById<TextView>(R.id.tvComplaint).text = doc.getString("complaint") ?: "No complaint noted"
                    findViewById<TextView>(R.id.tvDiagnosis).text = doc.getString("diagnosis") ?: "No diagnosis yet"
                    findViewById<TextView>(R.id.tvTreatment).text = doc.getString("treatment") ?: "No treatment done"

                    // Load case images
                    val imageUrls = doc.get("imageUrls") as? List<String>
                    if (imageUrls != null && imageUrls.isNotEmpty()) {
                        val iv1 = findViewById<ImageView>(R.id.ivCaseImage1)
                        val iv2 = findViewById<ImageView>(R.id.ivCaseImage2)
                        val iv3 = findViewById<ImageView>(R.id.ivCaseImage3)

                        if (imageUrls.size > 0) {
                            Glide.with(this).load(imageUrls[0]).placeholder(R.drawable.teeth_placeholder).centerCrop().into(iv1)
                        }
                        if (imageUrls.size > 1) {
                            Glide.with(this).load(imageUrls[1]).placeholder(R.drawable.teeth_placeholder).centerCrop().into(iv2)
                        }
                        if (imageUrls.size > 2) {
                            Glide.with(this).load(imageUrls[2]).placeholder(R.drawable.teeth_placeholder).centerCrop().into(iv3)
                        }
                    }
                } else {
                    Toast.makeText(this, "Case sheet not found", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Failed to load case: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}
