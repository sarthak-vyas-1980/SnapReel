"use client"

import { useState } from "react"
import ProfileHeader from "./ProfileHeader"
import ProfileForm from "./ProfileForm"
import PasswordForm from "./PasswordForm"
import DangerZone from "./DangerZone"

type UserData = {
  name: string
  email: string
  number: string
  avatar: string
}

export default function ProfileWrapper({ user, hasPassword }: { user: UserData, hasPassword: boolean }) {
  const [userData, setUserData] = useState(user)
  const [userHasPassword, setUserHasPassword] = useState(hasPassword)

  return (
    <div className="space-y-5 pb-8">
      {/* Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
        <ProfileHeader 
          name={userData.name} 
          email={userData.email} 
          avatar={userData.avatar} 
          onAvatarUpdate={(url) => setUserData(prev => ({ ...prev, avatar: url }))}
        />
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Personal Information</h3>
        <ProfileForm 
          initialData={{ name: userData.name, number: userData.number }} 
          onUpdate={(newData: Partial<UserData>) => setUserData(prev => ({ ...prev, ...newData }))} 
        />
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Security & Password</h3>
        {!userHasPassword && (
          <p className="text-xs text-gray-500 font-medium mb-4 max-w-sm mx-auto">
            You are signed in via Google OAuth. Set a password below to enable manual login functionality.
          </p>
        )}
        <div className="max-w-md mx-auto text-left">
           <PasswordForm hasPassword={userHasPassword} onSuccess={() => setUserHasPassword(true)} />
        </div>
      </div>

      {/* Danger Zone */}
      <DangerZone />

    </div>
  )
}
