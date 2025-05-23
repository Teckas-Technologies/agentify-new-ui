
interface Props {
    name: string;
    description: string;
    icon: string;
    active: boolean;
}

export default function NodeName({ name, description, icon, active }: Props) {

    return (
        <div className={`group flex items-center gap-4 p-4 mt-1 cursor-pointer transition-all duration-300 from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-sm 
                                ${active
                ? "bg-gradient-to-r border border-primary/20"
                : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10"
            }`
        }>
            <div className="icon min-w-[2rem] w-[2rem] h-[2rem]">
                <img src={icon || "/icons/httprequest.svg"} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="names">
                <h2>{name}</h2>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
    )

}