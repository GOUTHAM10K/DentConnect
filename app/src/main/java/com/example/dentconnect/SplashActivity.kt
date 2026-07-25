package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.google.firebase.auth.FirebaseAuth

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        // Firebase Auto-Login Check
        val user = FirebaseAuth.getInstance().currentUser
        if (user != null) {
            // User is already logged in, go to Dashboard (MainActivity)
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_splash)

        findViewById<Button>(R.id.btnGetStarted).setOnClickListener {
            navigateToLogin()
        }

        findViewById<TextView>(R.id.tvLogin).setOnClickListener {
            navigateToLogin()
        }
    }

    private fun navigateToLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        // We don't finish() here so user can come back to splash if they want, 
        // or we could finish() if this is strictly a welcome screen.
        // Usually, welcome screens are finished once we go to login/signup.
        finish()
    }
}
