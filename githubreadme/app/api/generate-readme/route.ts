import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Octokit } from '@octokit/rest'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

const octokit = new Octokit({ auth: GITHUB_TOKEN })
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export async function POST(req: NextRequest) {
  const { repoUrl } = await req.json()
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })

  const [_, owner, repo] = match
  console.log(_, owner, repo)

  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo })

    const description = repoData.description || 'No description available.'
    const topics = repoData.topics?.join(', ') || 'No topics.'

    const filesToFetch = ['README.md', 'package.json', 'main.py', 'index.js']
    const contents: Record<string, string> = {}

    for (const filename of filesToFetch) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filename,
        })

        if ('content' in data) {
          contents[filename] = Buffer.from(data.content, 'base64').toString('utf-8')
        }
      } catch (_) {
        console.log(_)
      }
    }

    const contextText = Object.entries(contents)
      .map(([name, text]) => `### ${name}\n${text.substring(0, 1000)}\n`)
      .join('\n\n')

    const prompt = `
        You are an expert open-source documenter.

        Generate a professional README.md file for the following GitHub project:

        **Repository Info**
        - Name: ${repo}
        - Owner: ${owner}
        - Description: ${description}
        - Topics: ${topics}

        **Code Context**
        ${contextText || 'No files found'}

        Include:
        - Title
        - Description
        - Features (if possible)
        - Installation
        - Usage
        - Contributing
        - License
        Do not wrap final response in ' triple backticks markdown'
        `

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const generatedReadme = response.text()

    return NextResponse.json({ readme: generatedReadme })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch repo or generate README' }, { status: 500 })
  }
}
