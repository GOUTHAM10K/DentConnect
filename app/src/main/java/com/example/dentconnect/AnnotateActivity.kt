package com.example.dentconnect

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class  AnnotateActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_annotate)

        val ivBackground = findViewById<ImageView>(R.id.ivBackground)
        val drawView = findViewById<DrawView>(R.id.drawView)
        val btnClear = findViewById<Button>(R.id.btnClear)
        val btnSave = findViewById<Button>(R.id.btnSave)
        val ivClose = findViewById<ImageView>(R.id.ivClose)

        val imageUriString = intent.getStringExtra("imageUri")
        if (imageUriString != null) {
            val uri = Uri.parse(imageUriString)
            val inputStream = contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            ivBackground.setImageBitmap(bitmap)
        }

        btnClear.setOnClickListener {
            drawView.clear()
        }

        btnSave.setOnClickListener {
            // In a real app, we would combine the background and drawView and save as new URI
            finish()
        }

        ivClose.setOnClickListener {
            finish()
        }
    }
}
