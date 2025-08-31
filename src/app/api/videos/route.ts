import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/../generated/prisma";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary"

const prisma = new PrismaClient()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

interface CloudinaryResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any
}

export async function GET(req: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json(videos, { status: 200 })
    }
    catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 402 })
    }
    finally {
        await prisma.$disconnect()
    }
}

export async function POST (req: NextRequest) {
    const { userId } = await auth()

    if(!userId) {
        return NextResponse.json({ message: "User is unauthorised" })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const originalSize = formData.get("originalSize") as string

        if(!file) {
            return NextResponse.json({error: "File not found"}, { status: 400 })
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryResult>((resolve, reject) => {
            const upload_stream = cloudinary.uploader.upload_stream({
                folder: "cld-ai-saas-video",
                resource_type: "video",
                transformation: [
                    { quality: "auto", fetch_format: "mp4" }
                ]
            }, (err, result) => {
                if(err) reject(err);
                else resolve(result as CloudinaryResult)
            })
            upload_stream.end(buffer)
        })

        const video = await prisma.video.create({
            data: {
                title,
                description,
                originalSize,
                publicId: result.public_id,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })

        return NextResponse.json(video)
    }
    catch (error: any) {
        console.log("Upload video failed", error)
        return NextResponse.json({error: "Upload video failed"}, {status: 500})
    }
    finally {
        await prisma.$disconnect()
    }
}