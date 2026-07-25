package com.example.dentconnect

import android.content.Intent
import android.graphics.*
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.*

class CaseImagesActivity : AppCompatActivity() {

    private enum class Category { PRE_OP, INTRA_OP, POST_OP, FOLLOW_UP }
    private var currentCategory = Category.PRE_OP
    
    private val imagesMap = mutableMapOf<Category, MutableList<Uri>>(
        Category.PRE_OP to mutableListOf(),
        Category.INTRA_OP to mutableListOf(),
        Category.POST_OP to mutableListOf(),
        Category.FOLLOW_UP to mutableListOf()
    )

    private lateinit var rvImages: RecyclerView
    private lateinit var tvAddedImagesCount: TextView
    private lateinit var adapter: CaseImageAdapter
    private var selectedImageUri: Uri? = null
    private var selectedIndex: Int = -1
    private var caseId: String? = null

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var storage: FirebaseStorage

    // Slider UI
    private lateinit var llSliderContainer: LinearLayout
    private lateinit var tvSliderLabel: TextView
    private lateinit var tvSliderValue: TextView
    private lateinit var seekBar: SeekBar
    private var editMode: String = "" // "adjust" or "enhance"

    private val selectImageLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            imagesMap[currentCategory]?.add(it)
            updateImagesList()
        }
    }

    private val cropImageLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val croppedUri = result.data?.data
            if (croppedUri != null && selectedIndex != -1) {
                imagesMap[currentCategory]?.set(selectedIndex, croppedUri)
                updateImagesList()
            }
            Toast.makeText(this, "Image Cropped", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_case_images)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        storage = FirebaseStorage.getInstance()
        caseId = intent.getStringExtra("caseId")

        rvImages = findViewById(R.id.rvImages)
        tvAddedImagesCount = findViewById(R.id.tvAddedImagesCount)
        llSliderContainer = findViewById(R.id.llSliderContainer)
        tvSliderLabel = findViewById(R.id.tvSliderLabel)
        tvSliderValue = findViewById(R.id.tvSliderValue)
        seekBar = findViewById(R.id.seekBar)
        
        rvImages.layoutManager = GridLayoutManager(this, 2)
        updateImagesList()

        findViewById<LinearLayout>(R.id.llAddImages).setOnClickListener {
            selectImageLauncher.launch("image/*")
        }

        findViewById<Button>(R.id.btnBack).setOnClickListener { finish() }
        findViewById<ImageView>(R.id.ivBack).setOnClickListener { finish() }
        
        findViewById<TextView>(R.id.tvDraft).setOnClickListener {
            Toast.makeText(this, "Draft Saved", Toast.LENGTH_SHORT).show()
            finish()
        }

        findViewById<Button>(R.id.btnNextStep).setOnClickListener {
            uploadImagesAndProceed()
        }

        findViewById<Button>(R.id.btnCancelAdjust).setOnClickListener {
            llSliderContainer.visibility = View.GONE
        }

        findViewById<Button>(R.id.btnApplyAdjust).setOnClickListener {
            applyAdjustment()
        }

        seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val value = progress - 100
                tvSliderValue.text = if (value > 0) "+$value" else value.toString()
            }
            override fun onStartTrackingTouch(p0: SeekBar?) {}
            override fun onStopTrackingTouch(p0: SeekBar?) {}
        })

        setupCategories()
        setupEditingTools()
    }

    private fun uploadImagesAndProceed() {
        val allImages = imagesMap.values.flatten()
        if (allImages.isEmpty()) {
            val intent = Intent(this, CaseFindingsActivity::class.java)
            intent.putExtra("caseId", caseId)
            startActivity(intent)
            return
        }

        Toast.makeText(this, "Uploading images to network...", Toast.LENGTH_SHORT).show()
        
        val uploadedUrls = mutableListOf<String>()
        var uploadCount = 0
        
        for (uri in allImages) {
            val ref = storage.reference.child("cases/${caseId ?: UUID.randomUUID()}/${UUID.randomUUID()}.jpg")
            ref.putFile(uri).addOnSuccessListener {
                ref.downloadUrl.addOnSuccessListener { downloadUri ->
                    uploadedUrls.add(downloadUri.toString())
                    uploadCount++
                    if (uploadCount == allImages.size) {
                        saveUrlsAndProceed(uploadedUrls)
                    }
                }.addOnFailureListener {
                    uriToBase64(uri)?.let { b64 -> uploadedUrls.add(b64) }
                    uploadCount++
                    if (uploadCount == allImages.size) {
                        saveUrlsAndProceed(uploadedUrls)
                    }
                }
            }.addOnFailureListener {
                uriToBase64(uri)?.let { b64 -> uploadedUrls.add(b64) }
                uploadCount++
                if (uploadCount == allImages.size) {
                    saveUrlsAndProceed(uploadedUrls)
                }
            }
        }
    }

    private fun uriToBase64(uri: Uri): String? {
        return try {
            val inputStream = contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            if (bitmap != null) {
                val baos = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 50, baos)
                val bytes = baos.toByteArray()
                "data:image/jpeg;base64," + android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            } else null
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun saveUrlsAndProceed(urls: List<String>) {
        val user = auth.currentUser
        if (user == null) {
            val intent = Intent(this, CaseFindingsActivity::class.java)
            intent.putExtra("caseId", caseId)
            startActivity(intent)
            return
        }
        
        fun proceedNext() {
            Toast.makeText(this, "Uploaded & Shared to Network!", Toast.LENGTH_SHORT).show()
            val intent = Intent(this, CaseFindingsActivity::class.java)
            intent.putExtra("caseId", caseId)
            startActivity(intent)
        }

        if (caseId != null) {
            // 1. Update user's case in Firestore
            db.collection("users").document(user.uid).collection("cases").document(caseId!!)
                .update("imageUrls", urls)

            // 2. Fetch user & case details to publish/sync to Network Feed ('posts' collection)
            db.collection("users").document(user.uid).get().addOnSuccessListener { userDoc ->
                val userName = userDoc.getString("name") ?: "Dr. User"
                val userRole = userDoc.getString("specialization") ?: "Dentist"
                val userPhoto = userDoc.getString("photoUrl") ?: ""

                db.collection("users").document(user.uid).collection("cases").document(caseId!!).get()
                    .addOnSuccessListener { caseDoc ->
                        val patientId = caseDoc.getString("patientId") ?: ""
                        val complaint = caseDoc.getString("complaint") ?: ""
                        val diagnosis = caseDoc.getString("diagnosis") ?: ""

                        val newPostRef = db.collection("posts").document(caseId!!)
                        val post = Post(
                            postId = newPostRef.id,
                            userId = user.uid,
                            userName = userName,
                            userRole = userRole,
                            userPhoto = userPhoto,
                            caption = if (complaint.isNotEmpty()) "Case: $complaint" else "New Clinical Case Images",
                            caseTitle = if (patientId.isNotEmpty()) "Patient Ref: $patientId" else "Clinical Case",
                            diagnosis = diagnosis,
                            imageUrls = urls,
                            timestamp = System.currentTimeMillis(),
                            visibility = "public"
                        )
                        newPostRef.set(post).addOnCompleteListener {
                            proceedNext()
                        }
                    }
                    .addOnFailureListener { proceedNext() }
            }.addOnFailureListener { proceedNext() }
        } else {
            proceedNext()
        }
    }

    private fun updateImagesList() {
        val currentImages = imagesMap[currentCategory] ?: mutableListOf()
        adapter = CaseImageAdapter(currentImages) { index ->
            selectedImageUri = currentImages[index]
            selectedIndex = index
        }
        rvImages.adapter = adapter
        
        val totalCount = imagesMap.values.sumOf { it.size }
        tvAddedImagesCount.text = "Added images ($totalCount)"
    }

    private fun setupCategories() {
        val tvPreOp = findViewById<TextView>(R.id.tvPreOp)
        val tvIntraOp = findViewById<TextView>(R.id.tvIntraOp)
        val tvPostOp = findViewById<TextView>(R.id.tvPostOp)
        val tvFollowUp = findViewById<TextView>(R.id.tvFollowUp)

        val categories = listOf(tvPreOp, tvIntraOp, tvPostOp, tvFollowUp)

        tvPreOp.setOnClickListener { 
            currentCategory = Category.PRE_OP
            updateTabSelection(tvPreOp, categories.filter { it != tvPreOp })
            updateImagesList()
        }
        tvIntraOp.setOnClickListener { 
            currentCategory = Category.INTRA_OP
            updateTabSelection(tvIntraOp, categories.filter { it != tvIntraOp })
            updateImagesList()
        }
        tvPostOp.setOnClickListener { 
            currentCategory = Category.POST_OP
            updateTabSelection(tvPostOp, categories.filter { it != tvPostOp })
            updateImagesList()
        }
        tvFollowUp.setOnClickListener { 
            currentCategory = Category.FOLLOW_UP
            updateTabSelection(tvFollowUp, categories.filter { it != tvFollowUp })
            updateImagesList()
        }
    }

    private fun updateTabSelection(selected: TextView, unselected: List<TextView>) {
        selected.setBackgroundResource(R.drawable.bg_step_circle_active)
        selected.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.primary))
        selected.setTextColor(ContextCompat.getColor(this, R.color.white))
        selected.setTypeface(null, Typeface.BOLD)
        
        for (tv in unselected) {
            tv.setBackgroundResource(R.drawable.bg_button_outline)
            tv.setBackgroundTintList(null)
            tv.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
            tv.setTypeface(null, Typeface.NORMAL)
        }
    }

    private fun setupEditingTools() {
        findViewById<LinearLayout>(R.id.llEnhance).setOnClickListener {
            if (selectedImageUri == null) {
                Toast.makeText(this, "Select an image first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            editMode = "enhance"
            tvSliderLabel.text = "Enhance Intensity"
            seekBar.progress = 100
            llSliderContainer.visibility = View.VISIBLE
        }

        findViewById<LinearLayout>(R.id.llCrop).setOnClickListener {
            if (selectedImageUri == null) {
                Toast.makeText(this, "Select an image first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            try {
                val intent = Intent("com.android.camera.action.CROP")
                intent.setDataAndType(selectedImageUri, "image/*")
                intent.putExtra("crop", "true")
                intent.putExtra("aspectX", 1)
                intent.putExtra("aspectY", 1)
                intent.putExtra("return-data", true)
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                cropImageLauncher.launch(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Crop tool not found. Try Annotate instead.", Toast.LENGTH_SHORT).show()
            }
        }

        findViewById<LinearLayout>(R.id.llAdjust).setOnClickListener {
            if (selectedImageUri == null) {
                Toast.makeText(this, "Select an image first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            editMode = "adjust"
            tvSliderLabel.text = "Brightness"
            seekBar.progress = 100
            llSliderContainer.visibility = View.VISIBLE
        }

        findViewById<LinearLayout>(R.id.llAnnotate).setOnClickListener {
            if (selectedImageUri == null) {
                Toast.makeText(this, "Select an image first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val intent = Intent(this, AnnotateActivity::class.java)
            intent.putExtra("imageUri", selectedImageUri.toString())
            startActivity(intent)
        }
    }

    private fun applyAdjustment() {
        if (selectedImageUri == null) return
        
        val progress = seekBar.progress
        
        try {
            val inputStream = contentResolver.openInputStream(selectedImageUri!!)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

            if (originalBitmap == null) return

            val config = originalBitmap.config ?: Bitmap.Config.ARGB_8888
            val newBitmap = Bitmap.createBitmap(originalBitmap.width, originalBitmap.height, config)
            val canvas = Canvas(newBitmap)
            val paint = Paint()
            
            val cm = ColorMatrix()
            if (editMode == "adjust") {
                val brightness = (progress - 100) * 1.5f
                cm.set(floatArrayOf(
                    1f, 0f, 0f, 0f, brightness,
                    0f, 1f, 0f, 0f, brightness,
                    0f, 0f, 1f, 0f, brightness,
                    0f, 0f, 0f, 1f, 0f
                ))
            } else {
                val saturation = progress / 100f
                cm.setSaturation(saturation)
            }
            
            paint.colorFilter = ColorMatrixColorFilter(cm)
            canvas.drawBitmap(originalBitmap, 0f, 0f, paint)

            val tempFile = File(cacheDir, "edited_${System.currentTimeMillis()}.jpg")
            val out = FileOutputStream(tempFile)
            newBitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            out.flush()
            out.close()

            val newUri = Uri.fromFile(tempFile)
            if (selectedIndex != -1) {
                imagesMap[currentCategory]?.set(selectedIndex, newUri)
                selectedImageUri = newUri
                updateImagesList()
            }

            llSliderContainer.visibility = View.GONE
            Toast.makeText(this, "Adjustment Applied", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to apply edit: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
