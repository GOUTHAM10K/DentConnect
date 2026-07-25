package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.firestore.FirebaseFirestore

class OtpActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var verificationId: String? = null
    private var fullName: String? = null
    private var phoneNumber: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_otp)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        verificationId = intent.getStringExtra("verificationId")
        fullName = intent.getStringExtra("fullName")
        phoneNumber = intent.getStringExtra("phoneNumber")

        val etOtp = findViewById<EditText>(R.id.etOtp)
        val btnVerify = findViewById<Button>(R.id.btnVerify)

        btnVerify.setOnClickListener {
            val otpCode = etOtp.text.toString().trim()
            if (otpCode.length == 6 && verificationId != null) {
                val credential = PhoneAuthProvider.getCredential(verificationId!!, otpCode)
                signInWithPhoneAuthCredential(credential)
            } else {
                Toast.makeText(this, "Enter valid 6-digit OTP", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun signInWithPhoneAuthCredential(credential: PhoneAuthCredential) {
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    saveUserToFirestore()
                } else {
                    Toast.makeText(this, "Verification Failed: ${task.exception?.message}", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun saveUserToFirestore() {
        val user = auth.currentUser
        val uid = user?.uid ?: return

        val userMap = hashMapOf(
            "uid" to uid,
            "name" to (fullName ?: "User"),
            "phone" to (phoneNumber ?: ""),
            "role" to "doctor"
        )

        db.collection("users").document(uid)
            .set(userMap)
            .addOnSuccessListener {
                Toast.makeText(this, "Signup Successful", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                // Still navigate even if firestore fails
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            }
    }
}
