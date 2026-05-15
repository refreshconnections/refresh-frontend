import { createContext, useEffect, useState } from "react";

import { useGetUnreadCount } from "../hooks/api/chats/unread-count";




export type ChatBadgeContext = {
  chatBadgeCount: number,
  setChatBadgeCount:(count: number) => void,
}
export const ChatBadgeContext = createContext<ChatBadgeContext>({
  chatBadgeCount: 0,
  setChatBadgeCount: () => {},
  });


export const ChatBadgeContextProvider = (props: any) => {
  
  const [chatBadgeCount, setChatBadgeCount] = useState<number>(0)
  const unreadCount = useGetUnreadCount().data;



  useEffect(() => {
    setChatBadgeCount(unreadCount?.unread ?? 0)
}, [unreadCount]);


  
  return <ChatBadgeContext.Provider
            value={{chatBadgeCount,setChatBadgeCount}}>
              {props.children}
          </ChatBadgeContext.Provider>
}