import React, { useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets';
import { useState } from 'react';
import Message from './Message';
import toast from 'react-hot-toast';

function ChatBox() {

  const containerRef = useRef(null)

  const {selectedChat, theme, user, axios, token, setUser} = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished]= useState(false);

  const onSubmit = async(e) => {
    if (loading) return;
    try {
      e.preventDefault();
      if(!user) return toast('Login to send message')
        setLoading(true)
        const promptCopy = prompt
        setPrompt('')
        setMessages(prev => [...prev, {role: 'user', content: prompt, timestamp: Date.now(), isImage: false}])

        const {data} = await axios.post(`/api/message/${mode}`, {chatId: selectedChat._id, prompt, isPublished}, {headers: {Authorization: token}})

        if(data.success){
          setMessages(prev => [...prev, data.reply])
          
          //decrease credit
          if(mode === 'image'){
            setUser(prev => ({...prev, credits: prev.credits-2}))
          }
          else{
            setUser(prev => ({...prev, credits: prev.credits-1}))
          }
        }
        else{
          toast.error(data.message)
          setPrompt(promptCopy)
        }
    } 
    catch (error) {
      toast.error(error.message)
    }
    finally{
      setPrompt('')
      setLoading(false)
    }
  }

  useEffect(()=>{
    if(selectedChat){
      setMessages(selectedChat.messages)
    }
  },[selectedChat])

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior : 'smooth',
      })
    }
  },[messages])

  return (
    <div className="flex-1 ml-20 max-md:ml-0 p-5 flex flex-col h-screen">

      {/* Chat Messages */}
      <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center gap-3  text-primary h-full'> 
            <img src={theme === 'dark'? assets.logo_full : assets.logo_full_dark } className='w-full max-w-56 sm:max-w-68' alt="" />

            <p className='mt-5 text-4xl sm:text-center text-gray-400 dark:text-white'>Ask me anything.</p>

          </div>
        )}

        {messages.map((message,index)=> <Message key={index} message={message}/>)}

        {/* Three Dots Loading */}
        {
          loading && <div className='loader flex items-center gap-1.5 '>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
          </div>
        }
      </div>

      {mode === 'image' && (
        <label className='flex justify-center items-center gap-2 mb-3 text-sm mx-auto'>
          <p className='text-xs'>Publish Generated Image to Community</p>
          <input type="checkbox" className='cursor-pointer' checked={isPublished} onChange={(e)=>setIsPublished(e.target.checked)}/>
        </label>
      )}

      {/* Prompt Input Box */}
      <form onSubmit={onSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>
        <select onChange={(e)=>setMode(e.target.value)} value={mode} className='text-sm pl-3 pr-2 outline-none'>
          <option value="text" className='dark:bg-purple-900'>Text</option>
          <option value="image" className='dark:bg-purple-900'>Image</option>
        </select>
        <input onChange={(e)=>setPrompt(e.target.value)} value={prompt} type="text" placeholder='Type your prompt here...' className='flex-1 w-full text-sm outline-none' required/>
        <button type="submit" disabled={loading}>
          <img src={loading ? assets.stop_icon : assets.send_icon} className='w-8 cursor-pointer' alt="" />
        </button>
      </form>
    </div>
  )
}

export default ChatBox
