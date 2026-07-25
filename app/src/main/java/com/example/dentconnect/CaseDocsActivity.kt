package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class CaseDocsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_case_docs)

        val caseId = intent.getStringExtra("caseId")

        val ivCheck1 = findViewById<ImageView>(R.id.ivCheck1)
        val ivCheck2 = findViewById<ImageView>(R.id.ivCheck2)
        val ivCheck3 = findViewById<ImageView>(R.id.ivCheck3)
        val btnViewDocs = findViewById<Button>(R.id.btnViewDocs)

        // Initially hide checks for animation effect
        ivCheck1.visibility = View.INVISIBLE
        ivCheck2.visibility = View.INVISIBLE
        ivCheck3.visibility = View.INVISIBLE
        btnViewDocs.visibility = View.INVISIBLE

        val handler = Handler(Looper.getMainLooper())

        // Animate ticks one by one
        handler.postDelayed({
            ivCheck1.visibility = View.VISIBLE
        }, 1000)

        handler.postDelayed({
            ivCheck2.visibility = View.VISIBLE
        }, 2000)

        handler.postDelayed({
            ivCheck3.visibility = View.VISIBLE
            btnViewDocs.visibility = View.VISIBLE
        }, 3000)

        btnViewDocs.setOnClickListener {
            val intent = Intent(this, CaseSheetActivity::class.java)
            intent.putExtra("caseId", caseId)
            startActivity(intent)
        }
    }
}
