package com.example.dentconnect

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class NetworkActivity : AppCompatActivity() {

    private lateinit var db: FirebaseFirestore
    private lateinit var rvFeed: RecyclerView
    private val postsList = mutableListOf<Post>()
    private lateinit var adapter: PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_network)

        db = FirebaseFirestore.getInstance()
        rvFeed = findViewById(R.id.rvFeed)
        rvFeed.layoutManager = LinearLayoutManager(this)
        
        adapter = PostAdapter(postsList)
        rvFeed.adapter = adapter

        setupStories()
        fetchNetworkFeed()
        setupBottomNavigation()
    }

    private fun setupStories() {
        val rvStories = findViewById<RecyclerView>(R.id.rvStories)
        // For stories, we can reuse the connection circle adapter style
        // For now, let's just make it look like the reference image
    }

    private fun fetchNetworkFeed() {
        val currentUserId = db.app.get(com.google.firebase.auth.FirebaseAuth::class.java)?.currentUser?.uid ?: ""
        db.collection("posts")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { value, error ->
                if (error != null) {
                    Toast.makeText(this, "Error loading feed: ${error.message}", Toast.LENGTH_SHORT).show()
                    return@addSnapshotListener
                }

                postsList.clear()
                if (value != null) {
                    for (doc in value.documents) {
                        val post = doc.toObject(Post::class.java)
                        if (post != null) {
                            if (post.visibility != "private" || post.userId == currentUserId) {
                                postsList.add(post)
                            }
                        }
                    }
                }
                adapter.notifyDataSetChanged()
            }
    }

    private fun setupBottomNavigation() {
        findViewById<View>(R.id.llHome).setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
        findViewById<View>(R.id.llCases).setOnClickListener {
            // Already handled or navigate to Case list
        }
        findViewById<FloatingActionButton>(R.id.fabAdd).setOnClickListener {
            startActivity(Intent(this, NewCaseActivity::class.java))
        }
        findViewById<View>(R.id.llProfile).setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
            finish()
        }
    }
}
