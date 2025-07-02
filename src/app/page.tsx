import Link from 'next/link';
import { BookOpen, Brain, TrendingUp, ArrowRight, Zap, Users, Award, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-6 py-2 mb-8">
            <Zap className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm text-blue-200 font-medium">AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            MathOnGo
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Master <span className="text-blue-400 font-semibold">JEE & NEET</span> with intelligent test preparation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/auth/register">
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="border-2 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-950/20 transition-all duration-300 backdrop-blur-sm">
                Sign In
              </button>
            </Link>
            <button className="border-2 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-950/20 transition-all duration-300 backdrop-blur-sm">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center gap-8 text-sm text-gray-400 mb-16">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>50K+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>95% Success Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 hover:border-blue-500/50">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">Smart PDF Analysis</h3>
            <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
              Upload previous year papers and let our AI extract and categorize questions intelligently
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:border-purple-500/50">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">AI-Generated Tests</h3>
            <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
              Create personalized mock tests based on your weak areas and exam patterns
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:scale-105 hover:border-pink-500/50">
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-pink-400 transition-colors">Performance Analytics</h3>
            <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
              Get detailed insights with visual charts and personalized improvement recommendations
            </p>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Trusted by <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">thousands</span> of students
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              & their <span className="text-pink-400 font-semibold">parents</span> across the nation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Video Testimonial */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center rounded-2xl overflow-hidden">
                  {/* REPLACE "YOUR_VIDEO_ID" with actual YouTube video ID */}
                  <iframe 
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/MU4ps6jPdvw?rel=0&modestbranding=1&showinfo=0"
                    title="MathOnGo Student Success Story - JEE Preparation Testimonial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Testimonial Content */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Anup Kumar</h4>
                    <p className="text-blue-400 font-medium">JEE Main Qualifier</p>
                    <div className="flex text-yellow-400 mt-1">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                </div>
                
                <blockquote className="text-gray-300 text-lg leading-relaxed italic">
                  &ldquo;I joined the test series as it was recommended by my friends. The test series was very relevant. It matched with the exact pattern of questions in the real JEE Main exam. The 15-page analysis after every test helped me a lot. The video analysis of Anup sir after every test was also great. It was a great experience.&rdquo;
                </blockquote>
              </div>

              {/* Additional mini testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-xl border border-gray-700/30 p-6 rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      R
                    </div>
                    <div>
                      <p className="text-white font-medium">Ravi Sharma</p>
                      <div className="flex text-yellow-400 text-sm">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    &ldquo;AI-generated tests were spot on! Improved my Physics score by 40 marks.&rdquo;
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-xl border border-gray-700/30 p-6 rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      P
                    </div>
                    <div>
                      <p className="text-white font-medium">Priya Singh</p>
                      <div className="flex text-yellow-400 text-sm">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    &ldquo;The detailed analytics helped me identify my weak areas. Cracked NEET!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Transform</span> Your Preparation?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who&apos;ve already improved their scores with MathOnGo&apos;s AI-powered platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <button className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-yellow-500/25 flex items-center justify-center">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="border-2 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-blue-400 px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-950/20 transition-all duration-300 backdrop-blur-sm">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}