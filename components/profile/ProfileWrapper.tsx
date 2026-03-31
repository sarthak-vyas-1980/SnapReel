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
    <div className="space-y-4 pb-2 w-full">
      <div className="py-2 flex justify-center text-center">
        <ProfileHeader 
          name={userData.name} 
          email={userData.email} 
          avatar={userData.avatar} 
          onAvatarUpdate={(url) => setUserData(prev => ({ ...prev, avatar: url }))}
        />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent w-full my-4" />

      <div className="flex flex-col md:flex-row w-full justify-between items-stretch text-center md:text-left gap-8 md:gap-0">
        {/* Personal Info Container */}
        <div className="py-2 flex flex-col items-center md:items-start w-full md:w-[45%]">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 w-full text-center md:text-left text-gray-400">Personal Information</h3>
          <div className="w-full">
            <ProfileForm 
              initialData={{ name: userData.name, number: userData.number }} 
              onUpdate={(newData: Partial<UserData>) => setUserData(prev => ({ ...prev, ...newData }))} 
            />
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-400 dark:via-gray-600 to-transparent mx-2 self-stretch" />

        {/* Security Container */}
        <div className="py-2 flex flex-col items-center md:items-start w-full md:w-[45%]">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 w-full text-center md:text-left text-gray-400">Security & Password</h3>
          <div className="w-full text-center md:text-left">
            {!userHasPassword && (
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">
                You are signed in via Google OAuth. Set a password below to enable manual login functionality.
              </p>
            )}
            <div className="max-w-md mx-auto md:mx-0 w-full">
               <PasswordForm hasPassword={userHasPassword} onSuccess={() => setUserHasPassword(true)} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent w-full my-4" />

      {/* Danger Zone */}
      <div className="py-2 text-center flex flex-col items-center justify-center">
        <DangerZone />
      </div>
    </div>
  )
}
