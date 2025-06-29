export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TestPrep Pro
        </h1>
        <p className="text-2xl text-gray-700 mb-8">
          Your AI-powered test preparation platform for JEE & NEET
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">📄 Upload PDFs</h3>
            <p className="text-gray-600">Upload previous year question papers</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">📝 Take Tests</h3>
            <p className="text-gray-600">Generate custom tests with AI</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">📊 Track Progress</h3>
            <p className="text-gray-600">Get detailed analytics</p>
          </div>
        </div>
        
        <div className="mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 mr-4">
            Get Started
          </button>
          <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}