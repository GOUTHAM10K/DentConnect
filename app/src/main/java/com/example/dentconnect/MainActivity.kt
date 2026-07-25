package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class MainActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        // Check if user is logged in
        if (auth.currentUser == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val tvWelcome = findViewById<TextView>(R.id.tvWelcomeDr)
        val ivNotifications = findViewById<ImageView>(R.id.ivNotifications)
        val llNewCaseAction = findViewById<LinearLayout>(R.id.llNewCaseAction)
        val llDraftsAction = findViewById<LinearLayout>(R.id.llDraftsAction)
        val llConsentAction = findViewById<LinearLayout>(R.id.llConsentAction)
        val fabAddCase = findViewById<FloatingActionButton>(R.id.fabAddCase)
        val llProfileNav = findViewById<LinearLayout>(R.id.llProfileNav)
        val llNetworkNav = findViewById<LinearLayout>(R.id.llNetworkNav)
        val llHomeNav = findViewById<LinearLayout>(R.id.llHomeNav)
        val llCasesNav = findViewById<LinearLayout>(R.id.llCasesNav)

        ivNotifications.setOnClickListener {
            startActivity(Intent(this, NotificationsActivity::class.java))
        }

        llDraftsAction.setOnClickListener {
            startActivity(Intent(this, DraftsActivity::class.java))
        }

        llConsentAction.setOnClickListener {
            startActivity(Intent(this, CaseConsentActivity::class.java))
        }

        llNetworkNav.setOnClickListener {
            startActivity(Intent(this, NetworkActivity::class.java))
        }

        llProfileNav.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        llHomeNav.setOnClickListener {
            // Already on Home
        }

        llCasesNav.setOnClickListener {
            // You can create a CasesActivity or reuse DraftsActivity
            startActivity(Intent(this, DraftsActivity::class.java))
        }

        val navigateToNewCase = {
            startActivity(Intent(this, NewCaseActivity::class.java))
        }

        llNewCaseAction.setOnClickListener { navigateToNewCase() }
        fabAddCase.setOnClickListener { navigateToNewCase() }
        
        // Fetch User Name from Firestore
        val userId = auth.currentUser?.uid
        userId?.let {
            db.collection("users").document(it).get()
                .addOnSuccessListener { document ->
                    if (document != null && document.exists()) {
                        val name = document.getString("name") ?: "User"
                        tvWelcome.text = "Welcome, $name 👋"
                        
                        // If we had Glide/Coil, we would load document.getString("photoUrl") here
                    } else {
                        tvWelcome.text = "Welcome! 👋"
                    }
                }
                .addOnFailureListener {
                    tvWelcome.text = "Welcome! 👋"
                }
        }
    }
}
