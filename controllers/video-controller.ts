import { Request, Response } from "express";
import { VideoCreateModel } from "models/VideoModel/videoCreateModel";
import { VideoUpdateTitleModel } from "models/VideoModel/videoUpdateTitleModel";
import { videoUrlParamsId } from "models/VideoModel/videoUrlParamsId";
import { VideoViewModel } from "models/VideoModel/videoViewModel";
import { IVideo, TypedRequestBody, TypedRequestWithParams } from "types";
import {pool} from '../db'
class VideoController {
    async createVideo(req: TypedRequestBody<VideoCreateModel>, res: Response<VideoViewModel>) {
        const {title, link, video_type} = req.body
        const newUser = await pool.query(`INSERT INTO videos (title, link, video_type) values ($1, $2, $3) RETURNING *`, [title, link, video_type])
        res.json(newUser.rows[0])
    }
    async getVideos(req: Request, res: Response<VideoViewModel[]>) {
        const videos = await pool.query('SELECT * FROM videos ORDER BY id ASC')
        res.json(videos.rows)
    }
    async getVideoById(req: TypedRequestWithParams<videoUrlParamsId>, res: Response<VideoViewModel|{data:string}>) {
        const id=req.params.id;
        const video = await pool.query(`SELECT * from videos WHERE id=$1`, [id])
        if (video.rows.length){
            res.json(video.rows[0])
        } else res.json({data: 'there is no video with such id'})
        
    } 
    async updateVideoTitle(req: TypedRequestBody<VideoUpdateTitleModel>, res: Response<VideoViewModel|{data: string}>) {
        const {id, title} = req.body;
        const apdatedVideo = await pool.query(`UPDATE videos SET title=$1 where id=$2 RETURNING *`, [title, id])
        if (apdatedVideo.rows.length){
            res.json(apdatedVideo.rows[0])
        } else res.json({data: 'there is no video with such id'})
        
    }
    async deleteVideo(req: TypedRequestWithParams<videoUrlParamsId>, res: Response<VideoViewModel[]|{data: string}>) {
        const id=req.params.id;
        const video = await pool.query(`DELETE from videos WHERE id=$1 RETURNING *`, [id])
        if (video.rows.length){
            res.json(video.rows)
        } else res.json({data: 'there is no video with such id'})
    }
}

export const video_controller = new VideoController(); 