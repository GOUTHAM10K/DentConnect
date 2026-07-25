package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.PopupMenu
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class ProfileActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var ivProfileLarge: ImageView

    private val capturePhotoLauncher = registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        if (bitmap != null) {
            ivProfileLarge.setImageBitmap(bitmap)
            Toast.makeText(this, "Profile photo updated locally", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        ivProfileLarge = findViewById(R.id.ivProfileLarge)
        
        setupBottomNavigation()
        loadUserProfile()

        findViewById<View>(R.id.btnEditProfile).setOnClickListener {
            startActivity(Intent(this, EditProfileActivity::class.java))
        }

        ivProfileLarge.setOnClickListener {
            capturePhotoLauncher.launch(null)
        }

        findViewById<ImageView>(R.id.ivSettings).setOnClickListener {
            val popup = PopupMenu(this, it)
            popup.menu.add("Logout")
            popup.setOnMenuItemClickListener { item ->
                if (item.title == "Logout") {
                    auth.signOut()
                    val intent = Intent(this, SplashActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
                true
            }
            popup.show()
        }
    }

    override fun onResume() {
        super.onResume()
        loadUserProfile() // Refresh data if updated in Edit screen
    }

    private fun loadUserProfile() {
        val user = auth.currentUser ?: return
        val tvName = findViewById<TextView>(R.id.tvProfileName)
        val tvSpec = findViewById<TextView>(R.id.tvProfileSpec)
        val tvLoc = findViewById<TextView>(R.id.tvProfileLoc)

        db.collection("users").document(user.uid).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    tvName.text = doc.getString("name") ?: "User"
                    tvSpec.text = doc.getString("specialization") ?: "Dental Clinician"
                    tvLoc.text = doc.getString("location") ?: "Unknown Location"
                    
                    val photoUrl = doc.getString("photoUrl")
                    if (!photoUrl.isNullOrEmpty()) {
                        Glide.with(this).load(photoUrl).circleCrop().into(ivProfileLarge)
                    }
                }
            }
    }

    private fun setupBottomNavigation() {
        findViewById<View>(R.id.llHome).setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
        findViewById<View>(R.id.llCases).setOnClickListener {
            // Navigate to Cases
        }
        findViewById<FloatingActionButton>(R.id.fabAdd).setOnClickListener {
            startActivity(Intent(this, NewCaseActivity::class.java))
        }
        findViewById<View>(R.id.llNetwork).setOnClickListener {
            startActivity(Intent(this, NetworkActivity::class.java))
            finish()
        }
    }
}
