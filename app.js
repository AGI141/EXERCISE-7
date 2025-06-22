const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const uri = 'mongodb://localhost:27017';
const PORT = 3000;

app.use(express.json());

const client = new MongoClient(uri);

async function startServer() {
  try {
    await client.connect(); // Connect to MongoDB

    app.get('/analytics/passengers', async (req, res) => {
      try {
        const pipeline = [
          { $match: { role: "passenger" } },
          {
            $lookup: {
              from: "rides",
              localField: "_id",
              foreignField: "passengerId",
              as: "rides"
            }
          },
          { $unwind: "$rides" },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$name" },
              totalRides: { $sum: 1 },
              totalFare: { $sum: "$rides.fare" },
              avgDistance: { $avg: "$rides.distance" }
            }
          },
          {
            $project: {
              _id: 0,
              name: 1,
              totalRides: 1,
              totalFare: 1,
              avgDistance: 1
            }
          }
        ];

        const result = await client
          .db("EXERCISE7")
          .collection("users")
          .aggregate(pipeline)
          .toArray();

        res.json(result);
      } catch (err) {
        console.error("Aggregation error:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(" Failed to connect to MongoDB:", err);
  }
}

startServer();
