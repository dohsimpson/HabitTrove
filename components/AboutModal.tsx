'use client'

import { Dialog, DialogContent, DialogHeader } from "./ui/dialog"
import { Button } from "./ui/button"
import { Star, History } from "lucide-react"
import packageJson from '../package.json'
import { DialogTitle } from "@radix-ui/react-dialog"
import { Logo } from "./Logo"
import ChangelogModal from "./ChangelogModal"
import { useState } from "react"

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const version = packageJson.version
  const [changelogOpen, setChangelogOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle aria-label="about"></DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-center py-4">
          <div>
            <div className="flex justify-center mb-1">
              <Logo />
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">v{version}</p>
            </div>
            <div className="py-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2"
                onClick={() => setChangelogOpen(true)}
              >
                <History className="w-3 h-3 mr-1" />
                Changelog
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm">
              Created with ❤️ by{' '}
              <a
                href="https://github.com/dohsimpson"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                @dohsimpson
              </a>
            </div>

            <div className="flex justify-center">
              <a
                href="https://github.com/dohsimpson/habittrove"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
      <ChangelogModal
        isOpen={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />
    </Dialog>
  )
}
