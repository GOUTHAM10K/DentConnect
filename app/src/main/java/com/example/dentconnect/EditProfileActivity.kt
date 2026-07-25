package com.example.dentconnect

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import java.io.ByteArrayOutputStream

class EditProfileActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var storage: FirebaseStorage
    private lateinit var ivProfileEdit: ImageView
    private lateinit var etNameEdit: EditText
    private lateinit var spSpecEdit: Spinner
    private lateinit var etLocEdit: EditText
    
    private var profileBitmap: Bitmap? = null

    private val capturePhotoLauncher = registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        if (bitmap != null) {
            ivProfileEdit.setImageBitmap(bitmap)
            profileBitmap = bitmap
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_edit_profile)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        storage = FirebaseStorage.getInstance()

        ivProfileEdit = findViewById(R.id.ivProfileEdit)
        etNameEdit = findViewById(R.id.etNameEdit)
        spSpecEdit = findViewById(R.id.spSpecEdit)
        etLocEdit = findViewById(R.id.etLocEdit)
        val tvChangePhoto = findViewById<TextView>(R.id.tvChangePhoto)
        val tvSave = findViewById<TextView>(R.id.tvSave)
        val ivBack = findViewById<ImageView>(R.id.ivBack)

        // Setup Spinner
        val specs = arrayOf("General Dentistry", "Orthodontics", "Endodontics", "Periodontics", "Oral Surgery", "Prosthodontics")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, specs)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spSpecEdit.adapter = adapter

        loadCurrentData()

        tvChangePhoto.setOnClickListener { capturePhotoLauncher.launch(null) }
        ivProfileEdit.setOnClickListener { capturePhotoLauncher.launch(null) }
        ivBack.setOnClickListener { finish() }
        
        tvSave.setOnClickListener { 
            if (profileBitmap != null) {
                uploadImageAndSave()
            } else {
                saveChanges(null)
            }
        }
    }

    private fun loadCurrentData() {
        val user = auth.currentUser ?: return
        db.collection("users").document(user.uid).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    etNameEdit.setText(doc.getString("name"))
                    etLocEdit.setText(doc.getString("location"))
                    
                    val spec = doc.getString("specialization")
                    @Suppress("UNCHECKED_CAST")
                    val spinnerAdapter = spSpecEdit.adapter as? ArrayAdapter<String>
                    val pos = spinnerAdapter?.getPosition(spec ?: "") ?: -1
                    if (pos != -1) spSpecEdit.setSelection(pos)
                }
            }
    }

    private fun uploadImageAndSave() {
        val user = auth.currentUser ?: return
        val storageRef = storage.reference.child("profile_photos/${user.uid}.jpg")
        
        val baos = ByteArrayOutputStream()
        profileBitmap!!.compress(Bitmap.CompressFormat.JPEG, 70, baos)
        val data = baos.toByteArray()

        Toast.makeText(this, "Uploading photo...", Toast.LENGTH_SHORT).show()

        storageRef.putBytes(data)
            .addOnSuccessListener {
                storageRef.downloadUrl.addOnSuccessListener { uri ->
                    saveChanges(uri.toString())
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Upload failed: ${e.message}", Toast.LENGTH_SHORT).show()
                saveChanges(null)
            }
    }

    private fun saveChanges(photoUrl: String?) {
        val user = auth.currentUser ?: return
        val updates = hashMapOf<String, Any>(
            "name" to etNameEdit.text.toString().trim(),
            "specialization" to spSpecEdit.selectedItem.toString(),
            "location" to etLocEdit.text.toString().trim()
        )
        
        photoUrl?.let { updates["photoUrl"] = it }

        db.collection("users").document(user.uid).update(updates)
            .addOnSuccessListener {
                Toast.makeText(this, "Profile Updated", Toast.LENGTH_SHORT).show()
                finish()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Update failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}
