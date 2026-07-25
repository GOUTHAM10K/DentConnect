package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class NewCaseActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    
    private var selectedGender: String = "Male"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_case)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        // Safety check: ensure user is logged in
        if (auth.currentUser == null) {
            Toast.makeText(this, "Please login first", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val etPatientId = findViewById<EditText>(R.id.etPatientId)
        val etAge = findViewById<EditText>(R.id.etAge)
        val etComplaint = findViewById<EditText>(R.id.etComplaint)
        
        val tvMale = findViewById<TextView>(R.id.tvMale)
        val tvFemale = findViewById<TextView>(R.id.tvFemale)
        val tvOther = findViewById<TextView>(R.id.tvOther)

        findViewById<ImageView>(R.id.ivBack).setOnClickListener {
            finish()
        }

        findViewById<Button>(R.id.btnBack).setOnClickListener {
            finish()
        }

        // Gender Selection Logic
        tvMale.setOnClickListener { updateGenderSelection("Male", tvMale, tvFemale, tvOther) }
        tvFemale.setOnClickListener { updateGenderSelection("Female", tvFemale, tvMale, tvOther) }
        tvOther.setOnClickListener { updateGenderSelection("Other", tvOther, tvMale, tvFemale) }

        findViewById<TextView>(R.id.tvDraft).setOnClickListener {
            val patientId = etPatientId.text.toString().trim()
            val age = etAge.text.toString().trim()
            val complaint = etComplaint.text.toString().trim()

            if (patientId.isEmpty()) {
                Toast.makeText(this, "Enter Patient ID to save draft", Toast.LENGTH_SHORT).show()
            } else {
                saveDraft(patientId, "$age / $selectedGender", complaint)
            }
        }
        
        findViewById<Button>(R.id.btnNext).setOnClickListener {
            val patientId = etPatientId.text.toString().trim()
            val age = etAge.text.toString().trim()
            val complaint = etComplaint.text.toString().trim()

            // Strict Validation
            if (age.isEmpty()) {
                Toast.makeText(this, "Please enter Patient Age", Toast.LENGTH_SHORT).show()
                etAge.requestFocus()
                return@setOnClickListener
            }

            if (complaint.isEmpty()) {
                Toast.makeText(this, "Please enter Chief Complaint", Toast.LENGTH_SHORT).show()
                etComplaint.requestFocus()
                return@setOnClickListener
            }

            saveAndNext(patientId, age, selectedGender, complaint)
        }
    }

    private fun updateGenderSelection(gender: String, selectedView: TextView, varinit1: TextView, varinit2: TextView) {
        selectedGender = gender
        
        // Update Selected View
        selectedView.setBackgroundResource(R.drawable.bg_step_circle_active)
        selectedView.setTextColor(ContextCompat.getColor(this, R.color.white))
        
        // Update Unselected Views
        varinit1.setBackgroundResource(R.drawable.bg_input_field)
        varinit1.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
        
        varinit2.setBackgroundResource(R.drawable.bg_input_field)
        varinit2.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
    }

    private fun saveAndNext(patientId: String, age: String, gender: String, complaint: String) {
        val user = auth.currentUser
        if (user == null) {
            Toast.makeText(this, "Error: User not logged in", Toast.LENGTH_SHORT).show()
            return
        }
        
        val caseId = db.collection("users").document(user.uid).collection("cases").document().id
        
        val caseMap = hashMapOf(
            "caseId" to caseId,
            "patientId" to if (patientId.isEmpty()) "Auto-Gen-${System.currentTimeMillis().toString().takeLast(4)}" else patientId,
            "age" to age,
            "gender" to gender,
            "complaint" to complaint,
            "timestamp" to System.currentTimeMillis(),
            "status" to "active"
        )

        // Navigate immediately for speed, passing the new Case ID
        val intent = Intent(this, CaseImagesActivity::class.java)
        intent.putExtra("caseId", caseId)
        startActivity(intent)

        // Save in background
        db.collection("users").document(user.uid)
            .collection("cases").document(caseId).set(caseMap)
            .addOnFailureListener { e ->
                Toast.makeText(this, "Sync Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun saveDraft(patientId: String, ageGender: String, complaint: String) {
        val userId = auth.currentUser?.uid ?: return
        
        val draftMap = hashMapOf(
            "patientId" to patientId,
            "ageGender" to ageGender,
            "complaint" to complaint,
            "timestamp" to System.currentTimeMillis()
        )

        db.collection("users").document(userId)
            .collection("drafts").add(draftMap)
            .addOnSuccessListener {
                Toast.makeText(this, "Draft Saved", Toast.LENGTH_SHORT).show()
                finish()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Error saving draft: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}
