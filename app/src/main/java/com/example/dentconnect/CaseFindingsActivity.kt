package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class CaseFindingsActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var caseId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_case_findings)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        
        caseId = intent.getStringExtra("caseId")

        val etHistoryPresentIllness = findViewById<EditText>(R.id.etHistoryPresentIllness)
        val etMedicalDentalHistory = findViewById<EditText>(R.id.etMedicalDentalHistory)
        val etClinicalFindings = findViewById<EditText>(R.id.etClinicalFindings)
        val etPulpTests = findViewById<EditText>(R.id.etPulpTests)
        val etDiagnosis = findViewById<EditText>(R.id.etDiagnosis)
        val etTreatmentPlan = findViewById<EditText>(R.id.etTreatmentPlan)

        findViewById<ImageView>(R.id.ivBack).setOnClickListener {
            finish()
        }

        findViewById<Button>(R.id.btnBack).setOnClickListener {
            finish()
        }

        findViewById<TextView>(R.id.tvDraft).setOnClickListener {
            saveFindings(true)
        }

        findViewById<Button>(R.id.btnNext).setOnClickListener {
            saveFindings(false)
        }
    }

    private fun saveFindings(isDraft: Boolean) {
        val user = auth.currentUser ?: return
        
        val history = findViewById<EditText>(R.id.etHistoryPresentIllness).text.toString().trim()
        val medical = findViewById<EditText>(R.id.etMedicalDentalHistory).text.toString().trim()
        val clinical = findViewById<EditText>(R.id.etClinicalFindings).text.toString().trim()
        val pulp = findViewById<EditText>(R.id.etPulpTests).text.toString().trim()
        val diagnosis = findViewById<EditText>(R.id.etDiagnosis).text.toString().trim()
        val treatment = findViewById<EditText>(R.id.etTreatmentPlan).text.toString().trim()

        val findingsMap = hashMapOf(
            "history" to history,
            "medical" to medical,
            "clinical" to clinical,
            "pulp" to pulp,
            "diagnosis" to diagnosis,
            "treatment" to treatment,
            "lastUpdated" to System.currentTimeMillis()
        )

        if (caseId != null) {
            db.collection("users").document(user.uid)
                .collection("cases").document(caseId!!)
                .update(findingsMap as Map<String, Any>)
                .addOnSuccessListener {
                    Toast.makeText(this, if (isDraft) "Draft Saved" else "Findings Saved", Toast.LENGTH_SHORT).show()
                    if (!isDraft) {
                        val intent = Intent(this, CaseConsentActivity::class.java)
                        intent.putExtra("caseId", caseId)
                        startActivity(intent)
                    } else {
                        finish()
                    }
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Save failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
        } else {
            db.collection("users").document(user.uid)
                .collection("cases").add(findingsMap)
                .addOnSuccessListener { ref ->
                    val newId = ref.id
                    Toast.makeText(this, if (isDraft) "Draft Saved" else "Findings Saved", Toast.LENGTH_SHORT).show()
                    if (!isDraft) {
                        val intent = Intent(this, CaseConsentActivity::class.java)
                        intent.putExtra("caseId", newId)
                        startActivity(intent)
                    } else {
                        finish()
                    }
                }
        }
    }
}
