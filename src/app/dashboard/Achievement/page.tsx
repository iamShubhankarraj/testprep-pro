// src/app/dashboard/achievements/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

export default function AchievementsPage() {
  const achievements = [
    { id: 1, title: "First Test", description: "Complete your first test", icon: Trophy, earned: true },
    { id: 2, title: "Perfect Score", description: "Score 100% on a test", icon: Star, earned: true },
    { id: 3, title: "Study Streak", description: "Study for 7 days in a row", icon: Medal, earned: false },
    { id: 4, title: "Quick Learner", description: "Complete 10 tests", icon: Award, earned: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
            <p className="text-gray-300">Track your learning milestones</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className={`bg-white/10 backdrop-blur-xl border-white/20 ${achievement.earned ? 'ring-2 ring-yellow-400' : ''}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <achievement.icon className={`w-8 h-8 ${achievement.earned ? 'text-yellow-400' : 'text-white/60'}`} />
                  <CardTitle className="text-white">{achievement.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{achievement.description}</p>
                <div className="mt-3">
                  {achievement.earned ? (
                    <span className="text-yellow-400 font-semibold">✓ Earned</span>
                  ) : (
                    <span className="text-white/60">Not earned yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}