'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from "react"
import { getChangelog } from "@/app/actions/data"

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [changelog, setChangelog] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      const loadChangelog = async () => {
        const content = await getChangelog()
        console.log(content)
        setChangelog(content)
      }
      loadChangelog()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Changelog</DialogTitle>
        </DialogHeader>
        <div className="prose dark:prose-invert prose-sm max-w-none">
          <ReactMarkdown>{changelog}</ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  )
}
