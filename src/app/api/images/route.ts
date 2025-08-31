import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

interface CloudinaryResult {
    publicId: string;
    [key: string]: any;
}

export async function POST(req: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 406 })
        }

        const bytes = await req.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result: any = await new Promise((resolve, reject) => {
            const upload_stream = cloudinary.uploader.upload_stream(
                { folder: "cld-ai-saas-video" },
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result)
                }
            )
            upload_stream.end(buffer)
        })

        return NextResponse.json({ publicId: result.publicId }, { status: 200 })
    }
    catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({ error: "Upload image failed" }, { status: 500 })
    }
}