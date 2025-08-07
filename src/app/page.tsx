"use client";
import Link from 'next/link';
import { BookOpen, Brain, TrendingUp, ArrowRight, Zap, Users, Award, Clock, Play, Star, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [currentExam, setCurrentExam] = useState(0);
  const exams = ['PREP', 'JEE', 'NEET', 'BOARDS'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExam((prev) => (prev + 1) % exams.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full filter blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        
        {/* Particle System */}
<div className="absolute inset-0">
  {[...Array(50)].map((_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-twinkle"
      style={{
        left: `${(i * 7.3) % 100}%`,
        top: `${(i * 11.7) % 100}%`,
        animationDelay: `${(i * 0.2) % 3}s`,
        animationDuration: `${2 + (i % 3)}s`
      }}
    ></div>
  ))}
</div>
</div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-bold text-xl">TAP</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Success Stories</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          </div>
          <Link href="/auth/login">
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300">
              Sign In
            </button>
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-32">
          {/* Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full px-6 py-3 mb-12 animate-fade-in-up">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
            <Zap className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm text-blue-200 font-medium">AI-Powered Learning Revolution</span>
          </div>
          
          {/* Main Title with Animation */}
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <h1 className="text-8xl md:text-9xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
              TAP
            </h1>
            
            {/* Animated Subtitle */}
            <div className="text-3xl md:text-4xl text-white font-light mb-6 h-16 flex items-center justify-center">
              <span className="mr-4">Test App For</span>
              <div className="relative overflow-hidden h-16 w-32">
                <div 
                  className="absolute inset-0 transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateY(-${currentExam * 100}%)` }}
                >
                  {exams.map((exam, index) => (
                    <div 
                      key={exam} 
                      className={`h-16 flex items-center justify-center font-bold text-transparent bg-clip-text ${
                        exam === 'PREP' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                        exam === 'JEE' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        exam === 'NEET' ? 'bg-gradient-to-r from-pink-400 to-rose-400' :
                        'bg-gradient-to-r from-purple-400 to-violet-400'
                      }`}
                    >
                      {exam}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Experience the future of test preparation with our revolutionary AI platform that adapts to your learning style and maximizes your potential
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animation-delay-600">
            <Link href="/auth/register">
              <button className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white px-12 py-5 rounded-2xl text-lg font-bold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center">
                  Start Your Journey
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </button>
            </Link>
            
            <button className="group flex items-center space-x-3 text-white hover:text-blue-400 transition-colors duration-300">
              <div className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:border-blue-400/50 transition-all duration-300">
                <Play className="w-6 h-6 ml-1" />
              </div>
              <span className="text-lg font-medium">Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-gray-400 flex items-center justify-center">
                <Users className="w-4 h-4 mr-2" />
                Active Students
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-400 flex items-center justify-center">
                <Award className="w-4 h-4 mr-2" />
                Success Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400 flex items-center justify-center">
                <Clock className="w-4 h-4 mr-2" />
                AI Support
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mb-32">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
              Revolutionary <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Powered by cutting-edge AI technology to transform your learning experience
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white group-hover:text-blue-400 transition-colors">Smart PDF Analysis</h3>
                <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors mb-6">
                  Upload previous year papers and let our advanced AI extract, categorize, and analyze questions with unprecedented accuracy
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  99% Accuracy Rate
                </div>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Brain className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white group-hover:text-purple-400 transition-colors">AI Test Generation</h3>
                <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors mb-6">
                  Create personalized mock tests that adapt to your performance and target your specific weak areas with laser precision
                </p>
                <div className="flex items-center text-purple-400 font-medium">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Adaptive Learning
                </div>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-pink-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="bg-gradient-to-br from-pink-500/20 to-orange-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white group-hover:text-pink-400 transition-colors">Advanced Analytics</h3>
                <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors mb-6">
                  Get comprehensive performance insights with interactive visualizations and AI-powered recommendations for improvement
                </p>
                <div className="flex items-center text-pink-400 font-medium">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Real-time Insights
                </div>
              </div>
            </div>
          </div>
          </section>

{/* Interactive Demo Section */}
<section className="mb-32">
  <div className="relative">
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30"></div>
    <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-12">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-4xl font-bold text-white mb-6">
            See TAP in <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Action</span>
          </h3>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Watch how our AI transforms a simple PDF upload into a comprehensive test preparation experience
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">Upload previous year papers</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">AI analyzes and categorizes questions</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">Generate personalized tests instantly</span>
            </div>
          </div>

          <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center">
            Try Interactive Demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-600/50">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-blue-400/30 to-transparent rounded animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-purple-400/30 to-transparent rounded animate-pulse animation-delay-200"></div>
              <div className="h-4 bg-gradient-to-r from-pink-400/30 to-transparent rounded animate-pulse animation-delay-400"></div>
              <div className="h-8 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded mt-6 flex items-center justify-center">
                <span className="text-green-400 text-sm font-medium">✓ Analysis Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Testimonials Section */}
<section id="testimonials" className="mb-32">
  <div className="text-center mb-20">
    <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
      Success <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Stories</span>
    </h2>
    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
      Real students, real results, real transformations
    </p>
  </div>

  <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
    {/* Video Testimonial */}
    <div className="relative group">
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <iframe 
            className="w-full h-full rounded-2xl"
            src="https://www.youtube.com/embed/MU4ps6jPdvw?rel=0&modestbranding=1&showinfo=0"
            title="TAP Student Success Story"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>

    {/* Featured Testimonial */}
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-30"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl">
          <div className="flex items-start space-x-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                A
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">Anup Kumar</h4>
              <p className="text-blue-400 font-medium text-lg">JEE Main Qualifier • AIR 2,847</p>
              <div className="flex text-yellow-400 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
          </div>
          
          <blockquote className="text-gray-300 text-lg leading-relaxed italic mb-6">
            "TAP's AI-generated tests were incredibly accurate. The 15-page detailed analysis after every test helped me identify exactly where I was going wrong. The video explanations were like having a personal tutor available 24/7."
          </blockquote>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">+127</div>
              <div className="text-sm text-gray-400">Score Improvement</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">89%</div>
              <div className="text-sm text-gray-400">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">3 Months</div>
              <div className="text-sm text-gray-400">Preparation Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Additional Testimonials Grid */}
  <div className="grid md:grid-cols-3 gap-8">
    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 p-6 rounded-2xl hover:border-green-500/50 transition-all duration-300 group">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
          R
        </div>
        <div>
          <p className="text-white font-semibold">Ravi Sharma</p>
          <p className="text-green-400 text-sm">NEET Qualified</p>
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
        "Physics score improved by 40 marks in just 2 months. The AI knew exactly what I needed to work on."
      </p>
    </div>

    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 p-6 rounded-2xl hover:border-pink-500/50 transition-all duration-300 group">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
          P
        </div>
        <div>
          <p className="text-white font-semibold">Priya Singh</p>
          <p className="text-pink-400 text-sm">JEE Advanced</p>
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
        "The detailed analytics helped me crack JEE Advanced. Best investment I made for my preparation."
      </p>
    </div>

    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 p-6 rounded-2xl hover:border-blue-500/50 transition-all duration-300 group">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <p className="text-white font-semibold">Suresh Patel</p>
          <p className="text-blue-400 text-sm">Board Topper</p>
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
        "Scored 98% in boards. TAP's adaptive tests made all the difference in my preparation strategy."
      </p>
    </div>
  </div>
</section>

{/* Pricing Section */}
<section id="pricing" className="mb-32">
  <div className="text-center mb-20">
    <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
      Choose Your <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Plan</span>
    </h2>
    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
      Flexible pricing designed for every student's journey
    </p>
  </div>

  <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
    {/* Basic Plan */}
    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl hover:border-blue-500/50 transition-all duration-300">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
        <div className="text-4xl font-bold text-white mb-2">₹999<span className="text-lg text-gray-400">/month</span></div>
        <p className="text-gray-400">Perfect for beginners</p>
      </div>
      
      <ul className="space-y-4 mb-8">
        <li className="flex items-center text-gray-300">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          5 PDF uploads per month
        </li>
        <li className="flex items-center text-gray-300">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          20 AI-generated tests
        </li>
        <li className="flex items-center text-gray-300">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          Basic analytics
        </li>
        <li className="flex items-center text-gray-300">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          Email support                </li>
              </ul>
              
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300">
                Get Started
              </button>
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-75"></div>
              <div className="relative bg-gray-900 backdrop-blur-xl border border-purple-500/50 p-8 rounded-3xl">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                </div>
                
                <div className="text-center mb-8 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-2">₹1,999<span className="text-lg text-gray-400">/month</span></div>
                  <p className="text-gray-400">For serious aspirants</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Unlimited PDF uploads
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Unlimited AI tests
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Advanced analytics & insights
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Video explanations
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Performance tracking
                  </li>
                </ul>
                
                <Link href="/auth/register">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105">
                    Start Free Trial
                  </button>
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl hover:border-yellow-500/50 transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-4xl font-bold text-white mb-2">₹2,999<span className="text-lg text-gray-400">/month</span></div>
                <p className="text-gray-400">Complete preparation suite</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  1-on-1 mentoring sessions
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Custom study plans
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Live doubt sessions
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Exam strategy guidance
                </li>
              </ul>
              
              <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white py-4 rounded-2xl font-semibold transition-all duration-300">
                Contact Sales
              </button>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-400 font-medium">30-day money-back guarantee</span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-32">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "How accurate is the AI question extraction?",
                answer: "Our AI achieves 99%+ accuracy in extracting and categorizing questions from PDFs, using advanced computer vision and natural language processing."
              },
              {
                question: "Can I use TAP for multiple exams?",
                answer: "Absolutely! TAP supports JEE Main, JEE Advanced, NEET, and various board exams. The AI adapts to each exam's specific pattern and requirements."
              },
              {
                question: "How does the adaptive testing work?",
                answer: "Our AI analyzes your performance patterns and creates tests that focus on your weak areas while maintaining the right difficulty progression."
              },
              {
                question: "Is there a mobile app available?",
                answer: "Yes, TAP is available on web, mobile, and desktop platforms with full synchronization across all devices."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-50"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-16">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                Ready to <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Transform</span> Your Future?
              </h2>
              
              <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Join over 50,000 students who've already revolutionized their test preparation with TAP's AI-powered platform
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link href="/auth/register">
                  <button className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl shadow-yellow-500/25 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center">
                      Start Your Success Journey
                      <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </button>
                </Link>
                
                <button className="group flex items-center space-x-3 text-white hover:text-blue-400 transition-colors duration-300">
                  <div className="w-16 h-16 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:border-blue-400/50 transition-all duration-300">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <span className="text-xl font-medium">Schedule Personal Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <div>
                  <span className="text-white font-bold text-2xl">TAP</span>
                  <p className="text-gray-400 text-sm">Test App for Preparation</p>
                </div>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Revolutionizing test preparation with AI-powered learning solutions for JEE, NEET, and board exams.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 TAP. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}