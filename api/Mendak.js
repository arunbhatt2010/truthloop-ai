export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: "Mendak deployment successful 🐸",
    version: "deployment-test-1"
  });
}
