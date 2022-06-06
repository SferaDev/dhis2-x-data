// @ts-ignore
import { Card } from "@dhis2/ui";
import { useRouter } from "../../hooks/useRouter";
import { PageItem } from "../../pages";
import styles from "./HomeCard.module.css";

export interface HomeCardProps {
    item: PageItem;
}

export const HomeCard: React.FC<HomeCardProps> = ({ item }) => {
    const { navigate } = useRouter();

    return (
        <Card>
            <div className={styles.container} onClick={() => navigate(item.route)}>
                <h2 className={styles.title}>{item.label}</h2>
                <p className={styles.body}>{item.description ?? ""}</p>
            </div>
        </Card>
    );
};
