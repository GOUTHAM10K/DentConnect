package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.firestore.FirebaseFirestore

class SignupActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var googleSignInClient: GoogleSignInClient
    
    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var spSpecialization: Spinner
    private lateinit var etInstitution: EditText
    private lateinit var etLocation: EditText

    private val googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)!!
                firebaseAuthWithGoogle(account.idToken!!)
            } catch (e: ApiException) {
                Toast.makeText(this, "Google sign in failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signup)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        // Configure Google Sign In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Initialize Views
        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        spSpecialization = findViewById(R.id.spSpecialization)
        etInstitution = findViewById(R.id.etInstitution)
        etLocation = findViewById(R.id.etLocation)
        
        val btnSignup = findViewById<Button>(R.id.btnSignup)
        val tvLogin = findViewById<TextView>(R.id.tvLogin)
        val ivBack = findViewById<ImageView>(R.id.ivBack)

        // Populate Specialization Spinner
        val specializations = arrayOf("General Dentistry", "Orthodontics", "Endodontics", "Periodontics", "Oral Surgery", "Prosthodontics")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, specializations)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spSpecialization.adapter = adapter

        btnSignup.setOnClickListener {
            val name = etName.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()
            val spec = spSpecialization.selectedItem.toString()
            val inst = etInstitution.text.toString().trim()
            val loc = etLocation.text.toString().trim()

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill required fields (*)", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password.length < 6) {
                Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Email/Password Signup
            auth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        saveUserToFirestore(name, email, "", spec, inst, loc)
                    } else {
                        Toast.makeText(this, "Signup Failed: ${task.exception?.message}", Toast.LENGTH_SHORT).show()
                    }
                }
        }

        // Back button
        ivBack.setOnClickListener {
            onBackPressed()
        }

        tvLogin.setOnClickListener {
            onBackPressed()
        }
    }

    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    checkUserAndNavigate()
                } else {
                    Toast.makeText(this, "Firebase auth failed", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun checkUserAndNavigate() {
        val currentUser = auth.currentUser ?: return
        db.collection("users").document(currentUser.uid).get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    navigateToDashboard()
                } else {
                    saveUserToFirestore(
                        currentUser.displayName ?: "User",
                        currentUser.email ?: "",
                        currentUser.phoneNumber ?: "",
                        "General Dentistry",
                        "",
                        ""
                    )
                }
            }
    }

    private fun saveUserToFirestore(name: String, email: String, phone: String, spec: String, inst: String, loc: String) {
        val uid = auth.currentUser?.uid ?: return
        val userMap = hashMapOf(
            "uid" to uid,
            "name" to name,
            "email" to email,
            "phone" to phone,
            "specialization" to spec,
            "institution" to inst,
            "location" to loc,
            "role" to "doctor"
        )
        db.collection("users").document(uid).set(userMap)
            .addOnSuccessListener { navigateToDashboard() }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                navigateToDashboard()
            }
    }

    private fun navigateToDashboard() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
