package com.example.dentconnect

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class CaseConsentActivity : AppCompatActivity() {

    private lateinit var signaturePad: DrawView
    private lateinit var ivSignaturePhoto: ImageView
    private lateinit var llCameraUpload: View
    private lateinit var tvSignatureHint: TextView
    private var caseId: String? = null

    // For Camera Capture
    private val captureSignatureLauncher = registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        if (bitmap != null) {
            ivSignaturePhoto.setImageBitmap(bitmap)
            showImageMode()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_case_consent)

        caseId = intent.getStringExtra("caseId")

        signaturePad = findViewById(R.id.signaturePad)
        ivSignaturePhoto = findViewById(R.id.ivSignaturePhoto)
        llCameraUpload = findViewById(R.id.llCameraUpload)
        tvSignatureHint = findViewById(R.id.tvSignatureHint)
        
        val tvClearSignature = findViewById<TextView>(R.id.tvClearSignature)
        val btnConfirmSave = findViewById<Button>(R.id.btnConfirmSave)
        val cbTreatment = findViewById<CheckBox>(R.id.cbTreatment)
        val cbPhotography = findViewById<CheckBox>(R.id.cbPhotography)
        val cbAcademic = findViewById<CheckBox>(R.id.cbAcademic)

        findViewById<ImageView>(R.id.ivBack).setOnClickListener {
            finish()
        }

        // Hide hint when user starts drawing
        signaturePad.setOnTouchListener { _, _ ->
            tvSignatureHint.visibility = View.GONE
            false
        }

        llCameraUpload.setOnClickListener {
            captureSignatureLauncher.launch(null)
        }

        tvClearSignature.setOnClickListener {
            resetSignature()
        }

        btnConfirmSave.setOnClickListener {
            if (!cbTreatment.isChecked || !cbPhotography.isChecked || !cbAcademic.isChecked) {
                Toast.makeText(this, "Please accept all consents to proceed", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            saveConsentData()
        }
    }

    private fun showImageMode() {
        ivSignaturePhoto.visibility = View.VISIBLE
        signaturePad.visibility = View.GONE
        tvSignatureHint.visibility = View.GONE
    }

    private fun resetSignature() {
        signaturePad.clear()
        ivSignaturePhoto.visibility = View.GONE
        signaturePad.visibility = View.VISIBLE
        tvSignatureHint.visibility = View.VISIBLE
        ivSignaturePhoto.setImageURI(null)
    }

    private fun saveConsentData() {
        Toast.makeText(this, "Digital Consent Verified", Toast.LENGTH_SHORT).show()
        val intent = Intent(this, CaseDocsActivity::class.java)
        intent.putExtra("caseId", caseId)
        startActivity(intent)
    }
}
